import type { Metadata } from 'next';
import Link from 'next/link';
import { getDashboardData } from '@/lib/services/dashboard.service';
import { formatPKR } from '@/lib/utils/money';
import { formatDateTime } from '@/lib/utils/dates';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Panel } from '@/components/admin/Panel';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { EmptyState } from '@/components/admin/EmptyState';
import { LinkButton } from '@/components/ui/Button';
import { tableClass, tdClass, thClass, linkClass } from '@/components/admin/styles';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const o = data.orders;
  const openOrders = o.byFulfillment.pending + o.byFulfillment.confirmed + o.byFulfillment.processing;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="What needs attention right now, and how the store is doing."
        actions={
          <>
            <LinkButton href="/admin/orders?fulfillment=pending" variant="secondary" size="sm">
              Pending orders
            </LinkButton>
            <LinkButton href="/admin/products/new" size="sm">
              + New product
            </LinkButton>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Needs action" value={o.byFulfillment.pending} hint="New orders awaiting confirmation" href="/admin/orders?fulfillment=pending" tone={o.byFulfillment.pending > 0 ? 'alert' : 'default'} />
        <StatCard label="Payments to verify" value={o.awaitingPaymentVerification} hint="Bank transfer proofs uploaded" href="/admin/orders?payment=awaiting_verification" tone={o.awaitingPaymentVerification > 0 ? 'alert' : 'default'} />
        <StatCard label="Reviews to moderate" value={data.reviews.pending} href="/admin/reviews?status=pending" tone={data.reviews.pending > 0 ? 'alert' : 'default'} />
        <StatCard label="Failed notifications" value={data.notifications.failed} hint={`${data.notifications.pending} still pending`} href="/admin/notifications?status=failed" tone={data.notifications.failed > 0 ? 'alert' : 'default'} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sales · last 24h" value={formatPKR(o.revenue.last24h)} hint={`${o.orderCount.last24h} order${o.orderCount.last24h === 1 ? '' : 's'}`} tone="accent" />
        <StatCard label="Sales · last 7 days" value={formatPKR(o.revenue.last7d)} hint={`${o.orderCount.last7d} orders`} tone="accent" />
        <StatCard label="Sales · last 30 days" value={formatPKR(o.revenue.last30d)} hint={`${o.orderCount.last30d} orders`} tone="accent" />
        <StatCard label="Open orders" value={openOrders} hint={`${o.byFulfillment.shipped} shipped · ${o.byFulfillment.delivered} delivered`} href="/admin/orders" />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Recent orders" actions={<Link href="/admin/orders" className={`${linkClass} text-xs`}>View all</Link>} className="overflow-hidden">
          {data.recentOrders.length === 0 ? (
            <EmptyState title="No orders yet" hint="Orders placed on the storefront will show up here." />
          ) : (
            <div className="relative -m-5 overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>Order</th>
                    <th className={thClass}>Customer</th>
                    <th className={thClass}>Total</th>
                    <th className={thClass}>Payment</th>
                    <th className={thClass}>Status</th>
                    <th className={thClass}>Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order._id.toString()} className="hover:bg-ivory/60">
                      <td className={tdClass}>
                        <Link href={`/admin/orders/${order._id.toString()}`} className="font-mono text-xs font-semibold text-ink underline-offset-4 hover:underline">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className={tdClass}>
                        {order.shipping.fullName}
                        <span className="block text-xs text-ink-400">{order.shipping.city}</span>
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>{formatPKR(order.totalMinor)}</td>
                      <td className={tdClass}>
                        <StatusBadge status={order.paymentStatus} />
                        <span className="mt-1 block text-[10px] uppercase tracking-widest2 text-ink-400">{order.paymentMethod === 'cod' ? 'COD' : 'Bank'}</span>
                      </td>
                      <td className={tdClass}>
                        <StatusBadge status={order.fulfillmentStatus} />
                      </td>
                      <td className={`${tdClass} whitespace-nowrap text-xs text-ink-600`}>{formatDateTime(order.placedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Low stock" description={`${data.lowStockCount} published variant${data.lowStockCount === 1 ? '' : 's'} at 3 units or fewer`} actions={<Link href="/admin/products?stock=low" className={`${linkClass} text-xs`}>See all</Link>}>
            {data.lowStock.length === 0 ? (
              <p className="text-sm text-ink-600">Everything is stocked above the threshold.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-ink/5 text-sm">
                {data.lowStock.map((v) => (
                  <li key={v.sku} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <Link href={`/admin/products/${v.productId.toString()}/edit`} className="block truncate font-medium text-ink underline-offset-4 hover:underline">
                        {v.title}
                      </Link>
                      <span className="text-xs text-ink-400">
                        {v.size} / {v.colorName} · {v.sku}
                      </span>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 text-xs font-bold ${v.stock === 0 ? 'bg-burgundy text-ivory' : 'bg-amber-100 text-amber-900'}`}>
                      {v.stock} left
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Integrations">
            <ul className="flex flex-col gap-3 text-sm">
              {data.integrations.map((i) => (
                <li key={i.key} className="flex items-start gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${i.configured ? 'bg-lime-dark' : 'bg-burgundy'}`} aria-hidden="true" />
                  <div>
                    <p className="font-medium text-ink">
                      {i.label}{' '}
                      <span className="text-xs font-normal text-ink-400">{i.configured ? 'configured' : 'not configured'}</span>
                    </p>
                    <p className="text-xs text-ink-600">{i.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Catalog at a glance">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-ink-400">Published products</dt>
                <dd className="font-display text-xl">{data.catalog.published}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-400">Drafts</dt>
                <dd className="font-display text-xl">{data.catalog.draft}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-400">Customer accounts</dt>
                <dd className="font-display text-xl">{data.customers}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-400">All-time sales</dt>
                <dd className="font-display text-xl">{formatPKR(o.revenue.allTime)}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
