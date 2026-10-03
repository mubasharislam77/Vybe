import type { FulfillmentStatus, Order } from '@/types/domain';
import {
  transitionFulfillmentStatus,
  updatePaymentStatus,
  findOrderById,
} from '@/lib/repositories/orders.repo';
import { compensateCancelledOrder, releaseOrderStock } from './inventory-compensation';

export class InvalidTransitionError extends Error {
  constructor(from: FulfillmentStatus, to: FulfillmentStatus) {
    super(`Cannot move an order from "${from}" to "${to}"`);
  }
}

/**
 * Allowed fulfillment transitions (spec section 7). Enforced atomically in
 * the repo (conditional update on current status), not read-then-write —
 * see orders.repo.transitionFulfillmentStatus.
 */
const ALLOWED_FROM: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

function allowedFromStatuses(to: FulfillmentStatus): FulfillmentStatus[] {
  return (Object.keys(ALLOWED_FROM) as FulfillmentStatus[]).filter((from) => ALLOWED_FROM[from].includes(to));
}

export async function setFulfillmentStatus(
  orderId: string,
  to: FulfillmentStatus,
  by: string,
): Promise<Order> {
  const froms = allowedFromStatuses(to);
  const order = await findOrderById(orderId);
  if (!order) throw new Error('Order not found');
  if (!froms.includes(order.fulfillmentStatus)) {
    throw new InvalidTransitionError(order.fulfillmentStatus, to);
  }

  const ok = await transitionFulfillmentStatus(orderId, froms, to, by);
  if (!ok) {
    // Lost a race with a concurrent update since we read the order above.
    const fresh = await findOrderById(orderId);
    throw new InvalidTransitionError(fresh?.fulfillmentStatus ?? order.fulfillmentStatus, to);
  }

  if (to === 'cancelled') {
    await compensateCancelledOrder(order);
  } else if (to === 'returned') {
    await releaseOrderStock(order); // sale stands (coupon usage not refunded) — only stock comes back
  }

  const updated = await findOrderById(orderId);
  if (!updated) throw new Error('Order disappeared after update');
  return updated;
}

/**
 * Bank-transfer proof rejected: the order can never be paid as placed, so
 * it's cancelled (releasing stock/coupon) rather than left stuck "pending"
 * forever. A no-op if the order already moved past the point where
 * cancellation is possible (e.g. already shipped on another payment path).
 */
export async function markBankTransferFailed(orderId: string, by: string): Promise<Order> {
  await updatePaymentStatus(orderId, 'failed');
  const order = await findOrderById(orderId);
  if (order && ['pending', 'confirmed'].includes(order.fulfillmentStatus)) {
    return setFulfillmentStatus(orderId, 'cancelled', by);
  }
  if (!order) throw new Error('Order not found');
  return order;
}

export async function markBankTransferVerified(orderId: string): Promise<void> {
  await updatePaymentStatus(orderId, 'verified');
}
