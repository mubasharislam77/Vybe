import type { Order, PaymentStatus } from '@/types/domain';
import { findOrderById, updatePaymentStatus } from '@/lib/repositories/orders.repo';
import { markBankTransferFailed } from './order.service';

export class InvalidPaymentTransitionError extends Error {
  constructor(from: PaymentStatus, to: PaymentStatus) {
    super(`Cannot move payment from "${from}" to "${to}"`);
  }
}

/**
 * Manual payment bookkeeping done by staff. Unlike fulfillment, there is
 * no automated path here — every change is a human saying "I checked the
 * bank statement" or "the courier handed us the cash".
 *
 *   pending / awaiting_verification -> verified   (payment confirmed)
 *   pending / awaiting_verification -> failed     (bank proof rejected; cancels the order if still cancellable)
 *   failed -> verified                            (customer paid after all)
 *   verified -> refund_pending                    (only once the order is cancelled/returned)
 *   refund_pending -> refunded
 */
const ALLOWED: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['verified', 'failed'],
  awaiting_verification: ['verified', 'failed'],
  verified: ['refund_pending'],
  failed: ['verified'],
  refund_pending: ['refunded'],
  refunded: [],
};

export function allowedPaymentTransitions(order: Order): PaymentStatus[] {
  const next = ALLOWED[order.paymentStatus];
  const orderClosed = order.fulfillmentStatus === 'cancelled' || order.fulfillmentStatus === 'returned';
  return next.filter((to) => to !== 'refund_pending' || orderClosed);
}

export async function setPaymentStatus(orderId: string, to: PaymentStatus, by: string): Promise<Order> {
  const order = await findOrderById(orderId);
  if (!order) throw new Error('Order not found');
  if (!allowedPaymentTransitions(order).includes(to)) {
    throw new InvalidPaymentTransitionError(order.paymentStatus, to);
  }

  if (to === 'failed') {
    // Rejecting a bank-transfer proof means the order can't proceed as
    // placed — the existing service already handles the cancel+restock.
    return markBankTransferFailed(orderId, by);
  }

  await updatePaymentStatus(orderId, to);
  const updated = await findOrderById(orderId);
  if (!updated) throw new Error('Order disappeared after update');
  return updated;
}
