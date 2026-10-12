import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findCustomerById } from '@/lib/repositories/customers.repo';
import { listOrdersForCustomer } from '@/lib/repositories/orders.repo';
import { formatPKR } from '@/lib/utils/money';
import { formatDateTime } from '@/lib/utils/dates';
import { PageHeader } from '@/components/admin/PageHeader';
import { Panel } from '@/components/admin/Panel';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { linkClass, tableClass, tdClass, thClass } from '@/components/admin/styles';

export const metadata: Metadata = { title: 'Customer' };

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await findCustomerById(id);
  if (!customer) notFound();
  const { items: orders } = await listOrdersForCustomer(id, { pageSize: 48 });
  const spent = orders.filter((o) => o.fulfillmentStatus !== 'cancelled' && o.fulfillmentStatus !== 'returned').reduce((n, o) => n + o.totalMinor, 0);

  return (
    <>
      <PageHeader
        title={customer.fullName}
        description={`Customer since ${formatDateTime(customer.createdAt)}`}
        actions={
          <Link href="/admin/customers" className={`${linkClass} text-xs`}>
            ← All customers
          </Link>
        }
      />
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Contact">
            <dl className="flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-xs text-ink-400">Phone</dt>
                <dd>
                  <a href={`tel:${customer.phoneE164}`} className={linkClass}>
                    {customer.phoneE164}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-400">Email</dt>
                <dd>{customer.email ?? <span className="text-ink-400">—</span>}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-400">Lifetime spend</dt>
                <dd className="font-display text-xl">{formatPKR(spent)}</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Saved addresses">
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-ink-600">No saved addresses.</p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm text-ink-600">
                {customer.addresses.map((a, i) => (
                  <li key={i} className="border-l-2 border-ink/10 pl-3">
                    <span className="block font-medium text-ink">{a.fullName}</span>
                    {a.addressLine}, {a.city}, {a.province} · {a.phoneE164}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <Panel title={`Orders (${orders.length})`} className="overflow-hidden">
          {orders.length === 0 ? (
            <p className="text-sm text-ink-600">No orders placed while signed in.</p>
          ) : (
            <div className="relative -m-5 overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>Order</th>
                    <th className={thClass}>Total</th>
                    <th className={thClass}>Payment</th>
                    <th className={thClass}>Fulfillment</th>
                    <th className={thClass}>Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id.toString()} className="hover:bg-ivory/60">
                      <td className={tdClass}>
                        <Link href={`/admin/orders/${o._id.toString()}`} className="font-mono text-xs font-semibold text-ink underline-offset-4 hover:underline">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>{formatPKR(o.totalMinor)}</td>
                      <td className={tdClass}>
                        <StatusBadge status={o.paymentStatus} />
                      </td>
                      <td className={tdClass}>
                        <StatusBadge status={o.fulfillmentStatus} />
                      </td>
                      <td className={`${tdClass} whitespace-nowrap text-xs text-ink-600`}>{formatDateTime(o.placedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
