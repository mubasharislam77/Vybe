import type { Metadata } from 'next';
import Link from 'next/link';
import { listOrdersForAdmin } from '@/lib/repositories/orders.repo';
import { fulfillmentStatusSchema, paymentStatusSchema } from '@/lib/validation/admin';
import { formatPKR } from '@/lib/utils/money';
import { formatDateTime } from '@/lib/utils/dates';
import { getParam, type SearchParamsInput } from '@/lib/utils/query-params';
import { PageHeader } from '@/components/admin/PageHeader';
import { SearchFilterBar } from '@/components/admin/SearchFilterBar';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { EmptyState } from '@/components/admin/EmptyState';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { tableWrapClass, tableClass, tdClass, thClass } from '@/components/admin/styles';

export const metadata: Metadata = { title: 'Orders' };

const FULFILLMENT_OPTIONS = fulfillmentStatusSchema.options.map((v) => ({ value: v, label: v.replace(/_/g, ' ') }));
const PAYMENT_OPTIONS = paymentStatusSchema.options.map((v) => ({ value: v, label: v.replace(/_/g, ' ') }));

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SearchParamsInput> }) {
  const params = await searchParams;
  const q = getParam(params, 'q')?.trim() || undefined;
  const fulfillment = fulfillmentStatusSchema.safeParse(getParam(params, 'fulfillment'));
  const payment = paymentStatusSchema.safeParse(getParam(params, 'payment'));

  const { items, nextCursor } = await listOrdersForAdmin({
    q,
    fulfillmentStatus: fulfillment.success ? fulfillment.data : undefined,
    paymentStatus: payment.success ? payment.data : undefined,
    cursor: getParam(params, 'cursor'),
    pageSize: 30,
  });

  return (
    <>
      <PageHeader title="Orders" description="Search by order number or the customer's phone number (as entered at checkout)." />
      <SearchFilterBar
        basePath="/admin/orders"
        q={q}
        placeholder="Order number or phone (+92…)"
        selects={[
          { name: 'fulfillment', label: 'Fulfillment', value: fulfillment.success ? fulfillment.data : undefined, options: FULFILLMENT_OPTIONS },
          { name: 'payment', label: 'Payment', value: payment.success ? payment.data : undefined, options: PAYMENT_OPTIONS },
        ]}
      />

      <div className={tableWrapClass}>
        {items.length === 0 ? (
          <EmptyState title="No orders match" hint="Try clearing the filters." />
        ) : (
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Order</th>
                <th className={thClass}>Customer</th>
                <th className={thClass}>Items</th>
                <th className={thClass}>Total</th>
                <th className={thClass}>Payment</th>
                <th className={thClass}>Fulfillment</th>
                <th className={thClass}>Placed</th>
              </tr>
            </thead>
            <tbody>
              {items.map((order) => {
                const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
                return (
                  <tr key={order._id.toString()} className="hover:bg-ivory/60">
                    <td className={tdClass}>
                      <Link href={`/admin/orders/${order._id.toString()}`} className="font-mono text-xs font-semibold text-ink underline-offset-4 hover:underline">
                        {order.orderNumber}
                      </Link>
                      {order.customerId === null && <span className="block text-[10px] uppercase tracking-widest2 text-ink-400">Guest</span>}
                    </td>
                    <td className={tdClass}>
                      {order.shipping.fullName}
                      <span className="block text-xs text-ink-400">
                        {order.shipping.phoneE164} · {order.shipping.city}
                      </span>
                    </td>
                    <td className={tdClass}>{itemCount}</td>
                    <td className={`${tdClass} whitespace-nowrap font-medium`}>{formatPKR(order.totalMinor)}</td>
                    <td className={tdClass}>
                      <StatusBadge status={order.paymentStatus} />
                      <span className="mt-1 block text-[10px] uppercase tracking-widest2 text-ink-400">{order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Bank transfer'}</span>
                    </td>
                    <td className={tdClass}>
                      <StatusBadge status={order.fulfillmentStatus} />
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-xs text-ink-600`}>{formatDateTime(order.placedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <AdminPagination basePath="/admin/orders" searchParams={params} nextCursor={nextCursor} />
    </>
  );
}
