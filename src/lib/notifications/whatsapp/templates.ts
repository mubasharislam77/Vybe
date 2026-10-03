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

/**
 * Meta template parameter values may not contain newlines/tabs or runs of
 * 4+ spaces (Cloud API rejects the send otherwise) — only the STATIC
 * template text (reviewed and approved in Meta Business Manager) may have
 * formatting; every dynamic value we inject must be flattened to one line.
 */
function sanitizeParam(value: string): string {
  return value.replace(/[\n\t\r]+/g, ' • ').replace(/ {2,}/g, ' ').trim().slice(0, 300);
}

const MAIN_TEMPLATE_ITEM_LIMIT = 5;

export interface TemplatePlan {
  templateName: 'vybe_new_order' | 'vybe_new_order_document';
  bodyParams: string[];
  documentText?: string;
  documentFilename?: string;
}

/**
 * Picks between the two approved templates (see README "WhatsApp setup" for
 * the exact text to submit for review) based on order size: most orders
 * fit the single-message template; orders with many line items switch to
 * the document-header template plus a generated detailed text summary,
 * per spec section 8 ("orders too large for the approved message format").
 */
export function buildTemplatePlan(order: Order, adminOrderUrl: string): TemplatePlan {
  const itemsLine = order.items
    .map((i) => `${i.quantity}x ${i.title} (${i.size}/${i.colorName})`)
    .join(', ');

  const fitsMainTemplate = order.items.length <= MAIN_TEMPLATE_ITEM_LIMIT && itemsLine.length <= 300;

  const commonParams = [
    order.orderNumber,
    formatKarachiTime(order.placedAt),
    order.shipping.fullName,
    order.shipping.phoneE164,
    `${order.shipping.city}, ${order.shipping.province}`,
  ];

  if (fitsMainTemplate) {
    return {
      templateName: 'vybe_new_order',
      bodyParams: [
        ...commonParams,
        itemsLine,
        formatPKR(order.totalMinor),
        `${order.paymentMethod.toUpperCase()} (${order.paymentStatus})`,
        adminOrderUrl,
      ].map(sanitizeParam),
    };
  }

  return {
    templateName: 'vybe_new_order_document',
    bodyParams: [
      ...commonParams,
      `${order.items.length} items`,
      formatPKR(order.totalMinor),
      adminOrderUrl,
    ].map(sanitizeParam),
    documentText: buildOrderNotificationSummary(order),
    documentFilename: `order-${order.orderNumber}.txt`,
  };
}
