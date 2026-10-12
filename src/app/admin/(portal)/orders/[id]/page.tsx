import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findOrderById } from '@/lib/repositories/orders.repo';
import { findCustomerById } from '@/lib/repositories/customers.repo';
import { listNotificationsForOrder } from '@/lib/repositories/notifications.repo';
import { listAuditLogs } from '@/lib/repositories/audit.repo';
import { nextFulfillmentStatuses } from '@/lib/services/order.service';
import { allowedPaymentTransitions } from '@/lib/services/payment.service';
import { formatPKR } from '@/lib/utils/money';
import { formatDateTime } from '@/lib/utils/dates';
import { PageHeader } from '@/components/admin/PageHeader';
import { Panel } from '@/components/admin/Panel';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { OrderActions } from '@/components/admin/OrderActions';
import { JsonDetails } from '@/components/admin/JsonDetails';
import { linkClass, tableClass, tdClass, thClass } from '@/components/admin/styles';

export const metadata: Metadata = { title: 'Order' };

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await findOrderById(id);
  if (!order) notFound();

  const [customer, notifications, auditEntries] = await Promise.all([
    order.customerId ? findCustomerById(order.customerId.toString()) : Promise.resolve(null),
    listNotificationsForOrder(order._id),
    listAuditLogs({ targetType: 'order', targetId: order._id.toString(), limit: 50 }),
  ]);

  const trackingUrl = `/track-order/${order.orderNumber}?token=${encodeURIComponent(order.trackingToken)}`;

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        description={`Placed ${formatDateTime(order.placedAt)} · ${order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Bank transfer'}`}
        actions={
          <>
            <StatusBadge status={order.fulfillmentStatus} />
            <StatusBadge status={order.paymentStatus} />
            <Link href="/admin/orders" className={`${linkClass} text-xs`}>
              ← All orders
            </Link>
          </>
        }
      />

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Items" className="overflow-hidden">
            <div className="relative -m-5 overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>Product</th>
                    <th className={thClass}>Variant</th>
                    <th className={`${thClass} text-right`}>Unit</th>
                    <th className={`${thClass} text-right`}>Qty</th>
                    <th className={`${thClass} text-right`}>Line</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.sku}>
                      <td className={tdClass}>
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt="" className="h-12 w-10 shrink-0 object-cover" />
                          ) : (
                            <span className="h-12 w-10 shrink-0 bg-ink/5" />
                          )}
                          <div>
                            <Link href={`/admin/products?q=${encodeURIComponent(item.sku)}`} className="font-medium text-ink underline-offset-4 hover:underline">
                              {item.title}
                            </Link>
                            <span className="block text-xs text-ink-400">
                              {item.fulfillment === 'made_to_order' ? `Made to order · ${item.productionLeadTimeDays ?? '?'} days` : 'Ready stock'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className={tdClass}>
                        {item.size} / {item.colorName}
                        <span className="block font-mono text-[11px] text-ink-400">{item.sku}</span>
                      </td>
                      <td className={`${tdClass} whitespace-nowrap text-right`}>{formatPKR(item.unitPriceMinor)}</td>
                      <td className={`${tdClass} text-right`}>{item.quantity}</td>
                      <td className={`${tdClass} whitespace-nowrap text-right font-medium`}>{formatPKR(item.lineTotalMinor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="mt-5 ml-auto flex max-w-xs flex-col gap-1 border-t border-ink/10 pt-4 text-sm">
              <div className="flex justify-between gap-6">
                <dt className="text-ink-600">Subtotal</dt>
                <dd>{formatPKR(order.subtotalMinor)}</dd>
              </div>
              {order.discountMinor > 0 && (
                <div className="flex justify-between gap-6 text-burgundy">
                  <dt>Discount{order.coupon ? ` (${order.coupon.code})` : ''}</dt>
                  <dd>−{formatPKR(order.discountMinor)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-6">
                <dt className="text-ink-600">Shipping</dt>
                <dd>{formatPKR(order.shippingMinor)}</dd>
              </div>
              <div className="flex justify-between gap-6 border-t border-ink/10 pt-2 font-semibold">
                <dt>Total</dt>
                <dd>{formatPKR(order.totalMinor)}</dd>
              </div>
            </dl>
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Delivery">
              <address className="text-sm not-italic text-ink-600">
                <span className="block font-medium text-ink">{order.shipping.fullName}</span>
                {order.shipping.addressLine}
                <br />
                {order.shipping.city}, {order.shipping.province}
                {order.shipping.postalCode ? ` ${order.shipping.postalCode}` : ''}
                {order.shipping.landmark && (
                  <>
                    <br />
                    <span className="text-xs">Landmark: {order.shipping.landmark}</span>
                  </>
                )}
                <br />
                <a href={`tel:${order.shipping.phoneE164}`} className={linkClass}>
                  {order.shipping.phoneE164}
                </a>
                {order.shipping.alternatePhoneE164 && <span className="block text-xs">Alt: {order.shipping.alternatePhoneE164}</span>}
              </address>
              {order.notes && (
                <div className="mt-4 border-l-2 border-lime pl-3 text-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-widest2 text-ink-400">Customer note</p>
                  <p className="whitespace-pre-line text-ink-600">{order.notes}</p>
                </div>
              )}
            </Panel>

            <Panel title="Customer & payment">
              <dl className="flex flex-col gap-3 text-sm">
                <div>
                  <dt className="text-xs text-ink-400">Account</dt>
                  <dd>
                    {customer ? (
                      <Link href={`/admin/customers/${customer._id.toString()}`} className={linkClass}>
                        {customer.fullName}
                      </Link>
                    ) : (
                      <span className="text-ink-600">Guest checkout</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-400">Payment</dt>
                  <dd className="flex items-center gap-2">
                    {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Bank transfer'} <StatusBadge status={order.paymentStatus} />
                  </dd>
                </div>
                {order.bankTransferProof && (
                  <div>
                    <dt className="text-xs text-ink-400">Transfer proof</dt>
                    <dd>
                      <a href={order.bankTransferProof.url} target="_blank" rel="noreferrer" className={linkClass}>
                        Open proof ↗
                      </a>
                      <span className="block text-xs text-ink-400">Uploaded {formatDateTime(order.bankTransferProof.submittedAt)}</span>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-ink-400">Customer tracking link</dt>
                  <dd>
                    <a href={trackingUrl} target="_blank" rel="noreferrer" className={`${linkClass} break-all text-xs`}>
                      {trackingUrl}
                    </a>
                  </dd>
                </div>
              </dl>
            </Panel>
          </div>

          <Panel title="Timeline">
            <ol className="flex flex-col gap-2 text-sm">
              {[...order.statusHistory].reverse().map((h, i) => (
                <li key={`${h.status}-${i}`} className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={h.status} />
                  <span className="text-ink-600">{formatDateTime(h.at)}</span>
                  <span className="text-xs text-ink-400">by {h.by}</span>
                </li>
              ))}
            </ol>
            {order.staffNotes && order.staffNotes.length > 0 && (
              <div className="mt-5 border-t border-ink/10 pt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest2 text-ink-400">Internal notes</p>
                <ul className="flex flex-col gap-3 text-sm">
                  {[...order.staffNotes].reverse().map((n, i) => (
                    <li key={i} className="border-l-2 border-ink/20 pl-3">
                      <p className="whitespace-pre-line text-ink">{n.note}</p>
                      <p className="text-xs text-ink-400">
                        {n.by} · {formatDateTime(n.at)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Actions">
            <OrderActions orderId={order._id.toString()} fulfillmentNext={nextFulfillmentStatuses(order.fulfillmentStatus)} paymentNext={allowedPaymentTransitions(order)} />
          </Panel>

          <Panel title="Order alerts" description="Outbox entries for this order">
            {notifications.length === 0 ? (
              <p className="text-sm text-ink-600">No notification entries.</p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                {notifications.map((n) => (
                  <li key={n._id.toString()} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium uppercase">{n.channel}</span>
                      <StatusBadge status={n.status} />
                      <span className="text-xs text-ink-400">
                        {n.attempts}/{n.maxAttempts} attempts
                      </span>
                    </div>
                    {n.lastError && <p className="text-xs text-burgundy">{n.lastError}</p>}
                    {n.providerMessageId && <p className="font-mono text-[11px] text-ink-400">{n.providerMessageId}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Audit trail">
            {auditEntries.length === 0 ? (
              <p className="text-sm text-ink-600">No admin changes recorded yet.</p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                {auditEntries.map((a) => (
                  <li key={a._id.toString()}>
                    <p className="font-medium text-ink">{a.action.replace(/[._]/g, ' ')}</p>
                    <p className="text-xs text-ink-400">
                      {a.actorEmail} · {formatDateTime(a.at)}
                    </p>
                    <JsonDetails value={a.diff} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
