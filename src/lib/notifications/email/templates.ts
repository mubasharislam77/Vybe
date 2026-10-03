import type { Order } from '@/types/domain';
import { formatPKR } from '@/lib/utils/money';
import { formatKarachiTime } from '@/lib/notifications/whatsapp/templates';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export interface OrderEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildOrderEmail(order: Order, adminOrderUrl: string): OrderEmail {
  const itemRows = order.items
    .map(
      (i) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(i.title)}<br/>
            <span style="color:#888;font-size:12px;">${escapeHtml(i.size)} / ${escapeHtml(i.colorName)} · SKU ${escapeHtml(i.sku)}</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatPKR(i.lineTotalMinor)}</td>
        </tr>`,
    )
    .join('');

  const itemLines = order.items
    .map((i) => `${i.quantity}x ${i.title} (${i.size}/${i.colorName}) — ${formatPKR(i.lineTotalMinor)}`)
    .join('\n');

  const subject = `New order ${order.orderNumber} — ${formatPKR(order.totalMinor)}`;

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#171717;">
    <h2 style="margin:0 0 4px;">New order ${escapeHtml(order.orderNumber)}</h2>
    <p style="color:#888;margin:0 0 20px;">${formatKarachiTime(order.placedAt)}</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr><td style="color:#888;padding:4px 0;">Customer</td><td style="text-align:right;">${escapeHtml(order.shipping.fullName)}</td></tr>
      <tr><td style="color:#888;padding:4px 0;">Phone</td><td style="text-align:right;">${escapeHtml(order.shipping.phoneE164)}</td></tr>
      ${order.shipping.alternatePhoneE164 ? `<tr><td style="color:#888;padding:4px 0;">Alt. phone</td><td style="text-align:right;">${escapeHtml(order.shipping.alternatePhoneE164)}</td></tr>` : ''}
      <tr><td style="color:#888;padding:4px 0;">Address</td><td style="text-align:right;">${escapeHtml(order.shipping.addressLine)}, ${escapeHtml(order.shipping.city)}, ${escapeHtml(order.shipping.province)}</td></tr>
    </table>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <thead>
        <tr style="text-align:left;border-bottom:2px solid #171717;">
          <th style="padding:8px 0;">Item</th>
          <th style="padding:8px 0;text-align:center;">Qty</th>
          <th style="padding:8px 0;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr><td style="color:#888;padding:2px 0;">Subtotal</td><td style="text-align:right;">${formatPKR(order.subtotalMinor)}</td></tr>
      ${order.coupon ? `<tr><td style="color:#6B2438;padding:2px 0;">Discount (${escapeHtml(order.coupon.code)})</td><td style="text-align:right;color:#6B2438;">-${formatPKR(order.coupon.discountMinor)}</td></tr>` : ''}
      <tr><td style="color:#888;padding:2px 0;">Shipping</td><td style="text-align:right;">${formatPKR(order.shippingMinor)}</td></tr>
      <tr><td style="font-weight:bold;padding:8px 0 2px;border-top:1px solid #171717;">Total</td><td style="text-align:right;font-weight:bold;padding:8px 0 2px;border-top:1px solid #171717;">${formatPKR(order.totalMinor)}</td></tr>
    </table>

    <p style="margin:0 0 4px;"><strong>Payment:</strong> ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})</p>
    ${order.notes ? `<p style="margin:0 0 4px;"><strong>Notes:</strong> ${escapeHtml(order.notes)}</p>` : ''}

    <p style="margin-top:24px;">
      <a href="${adminOrderUrl}" style="background:#171717;color:#F4F0E8;padding:10px 20px;text-decoration:none;display:inline-block;">View Order</a>
    </p>
  </div>`;

  const text = [
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
    '',
    `View order: ${adminOrderUrl}`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  return { subject, html, text };
}
