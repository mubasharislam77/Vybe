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
