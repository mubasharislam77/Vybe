import { ObjectId, type ClientSession, type Filter } from 'mongodb';
import { orders } from '@/lib/db/collections';
import type { Order, FulfillmentStatus, PaymentStatus } from '@/types/domain';
import { clampPageSize, decodeCursor, encodeCursor, keysetFilter } from '@/lib/utils/pagination';

export async function insertOrder(doc: Omit<Order, '_id'>, session: ClientSession): Promise<Order> {
  const col = await orders();
  const result = await col.insertOne(doc as Order, { session });
  return { ...doc, _id: result.insertedId } as Order;
}

export async function findOrderByIdempotencyKey(key: string, session?: ClientSession): Promise<Order | null> {
  const col = await orders();
  return col.findOne({ idempotencyKey: key }, { session });
}

export async function findOrderByOrderNumber(orderNumber: string): Promise<Order | null> {
  const col = await orders();
  return col.findOne({ orderNumber });
}

/** Tracking page lookup — requires the private token, not just the (guessable-ish) order number. */
export async function findOrderByTrackingToken(orderNumber: string, trackingToken: string): Promise<Order | null> {
  const col = await orders();
  return col.findOne({ orderNumber, trackingToken });
}

export async function findOrderById(id: string): Promise<Order | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await orders();
  return col.findOne({ _id: new ObjectId(id) });
}

export async function listOrdersForCustomer(
  customerId: string,
  params: { cursor?: string; pageSize?: number },
): Promise<{ items: Order[]; nextCursor: string | null }> {
  const col = await orders();
  const pageSize = clampPageSize(params.pageSize);
  const base: Filter<Order> = { customerId: new ObjectId(customerId) };
  const cursor = decodeCursor(params.cursor);
  const filter = cursor ? { $and: [base, keysetFilter('createdAt', -1, cursor, true)] } : base;

  const docs = await col.find(filter).sort({ createdAt: -1, _id: -1 }).limit(pageSize + 1).toArray();
  const hasMore = docs.length > pageSize;
  const page = hasMore ? docs.slice(0, pageSize) : docs;
  const last = page.at(-1);
  const nextCursor =
    hasMore && last ? encodeCursor({ value: last.createdAt.toISOString(), id: last._id.toString() }) : null;
  return { items: page, nextCursor };
}

export interface AdminOrderFilters {
  fulfillmentStatus?: FulfillmentStatus;
  paymentStatus?: PaymentStatus;
  q?: string;
  cursor?: string;
  pageSize?: number;
}

export async function listOrdersForAdmin(
  filters: AdminOrderFilters,
): Promise<{ items: Order[]; nextCursor: string | null }> {
  const col = await orders();
  const pageSize = clampPageSize(filters.pageSize);
  const base: Filter<Order> = {};
  if (filters.fulfillmentStatus) base.fulfillmentStatus = filters.fulfillmentStatus;
  if (filters.paymentStatus) base.paymentStatus = filters.paymentStatus;
  if (filters.q) {
    base.$or = [
      { orderNumber: { $regex: `^${escapeRegex(filters.q)}`, $options: 'i' } },
      { 'shipping.phoneE164': filters.q },
    ];
  }

  const cursor = decodeCursor(filters.cursor);
  const filter = cursor ? { $and: [base, keysetFilter('createdAt', -1, cursor, true)] } : base;

  const docs = await col.find(filter).sort({ createdAt: -1, _id: -1 }).limit(pageSize + 1).toArray();
  const hasMore = docs.length > pageSize;
  const page = hasMore ? docs.slice(0, pageSize) : docs;
  const last = page.at(-1);
  const nextCursor =
    hasMore && last ? encodeCursor({ value: last.createdAt.toISOString(), id: last._id.toString() }) : null;
  return { items: page, nextCursor };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Conditional status transition: only succeeds if the order's current
 * status is one of `fromStatuses` at write time, so two concurrent admin
 * updates (or a webhook racing an admin click) can't both apply, and an
 * invalid transition (e.g. delivered -> pending) is rejected atomically
 * rather than checked-then-written.
 */
export async function transitionFulfillmentStatus(
  orderId: string,
  fromStatuses: FulfillmentStatus[],
  to: FulfillmentStatus,
  by: string,
): Promise<boolean> {
  const col = await orders();
  const now = new Date();
  const result = await col.updateOne(
    { _id: new ObjectId(orderId), fulfillmentStatus: { $in: fromStatuses } },
    {
      $set: { fulfillmentStatus: to, updatedAt: now },
      $push: { statusHistory: { status: to, at: now, by } },
    },
  );
  return result.modifiedCount === 1;
}

export async function updatePaymentStatus(orderId: string, status: PaymentStatus): Promise<void> {
  const col = await orders();
  await col.updateOne({ _id: new ObjectId(orderId) }, { $set: { paymentStatus: status, updatedAt: new Date() } });
}

export async function attachBankTransferProof(
  orderId: string,
  proof: { url: string; publicId: string },
): Promise<void> {
  const col = await orders();
  await col.updateOne(
    { _id: new ObjectId(orderId) },
    {
      $set: {
        bankTransferProof: { ...proof, submittedAt: new Date() },
        paymentStatus: 'awaiting_verification',
        updatedAt: new Date(),
      },
    },
  );
}

export interface OrderStats {
  byFulfillment: Record<FulfillmentStatus, number>;
  awaitingPaymentVerification: number;
  revenue: { last24h: number; last7d: number; last30d: number; allTime: number };
  orderCount: { last24h: number; last7d: number; last30d: number; allTime: number };
}

const EMPTY_FULFILLMENT: Record<FulfillmentStatus, number> = {
  pending: 0,
  confirmed: 0,
  processing: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0,
  returned: 0,
};

/**
 * Dashboard aggregates in a single `$facet` round-trip. "Revenue" counts
 * every order that hasn't been cancelled or returned (COD orders are
 * revenue once placed; an unpaid-but-live order still reflects demand) —
 * it's a sales figure, not reconciled cash.
 */
export async function getOrderStats(now = new Date()): Promise<OrderStats> {
  const col = await orders();
  const since = (ms: number) => new Date(now.getTime() - ms);
  const window = (ms: number) => [
    { $match: { placedAt: { $gte: since(ms) }, fulfillmentStatus: { $nin: ['cancelled', 'returned'] } } },
    { $group: { _id: null, revenue: { $sum: '$totalMinor' }, count: { $sum: 1 } } },
  ];
  const [row] = await col
    .aggregate<{
      byFulfillment: { _id: FulfillmentStatus; count: number }[];
      awaiting: { count: number }[];
      last24h: { revenue: number; count: number }[];
      last7d: { revenue: number; count: number }[];
      last30d: { revenue: number; count: number }[];
      allTime: { revenue: number; count: number }[];
    }>([
      {
        $facet: {
          byFulfillment: [{ $group: { _id: '$fulfillmentStatus', count: { $sum: 1 } } }],
          awaiting: [{ $match: { paymentStatus: 'awaiting_verification' } }, { $count: 'count' }],
          last24h: window(86_400_000),
          last7d: window(7 * 86_400_000),
          last30d: window(30 * 86_400_000),
          allTime: [
            { $match: { fulfillmentStatus: { $nin: ['cancelled', 'returned'] } } },
            { $group: { _id: null, revenue: { $sum: '$totalMinor' }, count: { $sum: 1 } } },
          ],
        },
      },
    ])
    .toArray();

  const byFulfillment = { ...EMPTY_FULFILLMENT };
  for (const r of row?.byFulfillment ?? []) byFulfillment[r._id] = r.count;
  const pick = (rows: { revenue: number; count: number }[] | undefined) => rows?.[0] ?? { revenue: 0, count: 0 };
  const w24 = pick(row?.last24h);
  const w7 = pick(row?.last7d);
  const w30 = pick(row?.last30d);
  const all = pick(row?.allTime);

  return {
    byFulfillment,
    awaitingPaymentVerification: row?.awaiting?.[0]?.count ?? 0,
    revenue: { last24h: w24.revenue, last7d: w7.revenue, last30d: w30.revenue, allTime: all.revenue },
    orderCount: { last24h: w24.count, last7d: w7.count, last30d: w30.count, allTime: all.count },
  };
}

export async function listRecentOrders(limit = 8): Promise<Order[]> {
  const col = await orders();
  return col.find({}).sort({ createdAt: -1, _id: -1 }).limit(limit).toArray();
}

export async function countOrdersForCustomer(customerId: string): Promise<number> {
  const col = await orders();
  return col.countDocuments({ customerId: new ObjectId(customerId) });
}

/** Per-customer lifetime totals for the admin customer list (orders placed under that account). */
export async function getCustomerOrderSummaries(
  customerIds: ObjectId[],
): Promise<Map<string, { orders: number; spentMinor: number; lastOrderAt: Date | null }>> {
  if (customerIds.length === 0) return new Map();
  const col = await orders();
  const rows = await col
    .aggregate<{ _id: ObjectId; orders: number; spentMinor: number; lastOrderAt: Date }>([
      { $match: { customerId: { $in: customerIds } } },
      {
        $group: {
          _id: '$customerId',
          orders: { $sum: 1 },
          spentMinor: {
            $sum: { $cond: [{ $in: ['$fulfillmentStatus', ['cancelled', 'returned']] }, 0, '$totalMinor'] },
          },
          lastOrderAt: { $max: '$placedAt' },
        },
      },
    ])
    .toArray();
  return new Map(rows.map((r) => [r._id.toString(), { orders: r.orders, spentMinor: r.spentMinor, lastOrderAt: r.lastOrderAt }]));
}

/** Free-text admin note appended to an order (visible to staff only, never to the customer). */
export async function appendOrderStaffNote(orderId: string, note: string, by: string): Promise<void> {
  const col = await orders();
  await col.updateOne(
    { _id: new ObjectId(orderId) },
    { $push: { staffNotes: { note, by, at: new Date() } }, $set: { updatedAt: new Date() } },
  );
}
