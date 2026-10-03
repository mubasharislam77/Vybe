import type { Order } from '@/types/domain';
import { formatPKR } from '@/lib/utils/money';

const KARACHI_TZ = 'Asia/Karachi';

function formatKarachiTime(date: Date): string {
  return new Intl.DateTimeFormat('en-PK', {
    timeZone: KARACHI_TZ,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/**
 * Plain-text summary stored in the outbox row for admin visibility
 * (notification history list) — not the actual WhatsApp template payload,
 * which is built separately in `client.ts` using Meta's approved template
 * parameters (see README "WhatsApp setup" for why free-form text can't be
 * sent directly).
 */
export function buildOrderNotificationSummary(order: Order): string {
  const itemLines = order.items
    .map((i) => `${i.quantity}x ${i.title} (${i.size}/${i.colorName}) — ${formatPKR(i.lineTotalMinor)}`)
    .join('\n');

  return [
    `New order ${order.orderNumber} — ${formatKarachiTime(order.placedAt)}`,
    `${order.shipping.fullName} — ${order.shipping.phoneE164}`,
    `${order.shipping.addressLine}, ${order.shipping.city}, ${order.shipping.province}`,
    '',
    itemLines,
    '',
    `Subtotal: ${formatPKR(order.subtotalMinor)}`,
    order.coupon ? `Discount (${order.coupon.code}): -${formatPKR(order.coupon.discountMinor)}` : null,
    `Shipping: ${formatPKR(order.shippingMinor)}`,
    `Total: ${formatPKR(order.totalMinor)}`,
    `Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})`,
    order.notes ? `Notes: ${order.notes}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

export { formatKarachiTime };
