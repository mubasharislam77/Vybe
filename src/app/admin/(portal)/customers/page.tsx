import type { Metadata } from 'next';
import Link from 'next/link';
import { listCustomersForAdmin } from '@/lib/repositories/customers.repo';
import { getCustomerOrderSummaries } from '@/lib/repositories/orders.repo';
import { formatPKR } from '@/lib/utils/money';
import { formatDate } from '@/lib/utils/dates';
import { getParam, type SearchParamsInput } from '@/lib/utils/query-params';
import { PageHeader } from '@/components/admin/PageHeader';
import { SearchFilterBar } from '@/components/admin/SearchFilterBar';
import { EmptyState } from '@/components/admin/EmptyState';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { tableWrapClass, tableClass, tdClass, thClass } from '@/components/admin/styles';

export const metadata: Metadata = { title: 'Customers' };

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<SearchParamsInput> }) {
  const params = await searchParams;
  const q = getParam(params, 'q')?.trim() || undefined;
  const { items, nextCursor } = await listCustomersForAdmin({ q, cursor: getParam(params, 'cursor'), pageSize: 30 });
  const summaries = await getCustomerOrderSummaries(items.map((c) => c._id));

  return (
    <>
      <PageHeader title="Customers" description="Registered accounts. Guest orders aren't listed here — find them under Orders by phone number." />
      <SearchFilterBar basePath="/admin/customers" q={q} placeholder="Name, email or phone" />
      <div className={tableWrapClass}>
        {items.length === 0 ? (
          <EmptyState title="No customers found" />
        ) : (
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Customer</th>
                <th className={thClass}>Contact</th>
                <th className={thClass}>Orders</th>
                <th className={thClass}>Spent</th>
                <th className={thClass}>Last order</th>
                <th className={thClass}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const id = c._id.toString();
                const s = summaries.get(id);
                return (
                  <tr key={id} className="hover:bg-ivory/60">
                    <td className={tdClass}>
                      <Link href={`/admin/customers/${id}`} className="font-medium text-ink underline-offset-4 hover:underline">
                        {c.fullName}
                      </Link>
                    </td>
                    <td className={`${tdClass} text-xs text-ink-600`}>
                      {c.phoneE164}
                      {c.email && <span className="block">{c.email}</span>}
                    </td>
                    <td className={tdClass}>{s?.orders ?? 0}</td>
                    <td className={`${tdClass} whitespace-nowrap`}>{formatPKR(s?.spentMinor ?? 0)}</td>
                    <td className={`${tdClass} whitespace-nowrap text-xs text-ink-600`}>{s?.lastOrderAt ? formatDate(s.lastOrderAt) : '—'}</td>
                    <td className={`${tdClass} whitespace-nowrap text-xs text-ink-600`}>{formatDate(c.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <AdminPagination basePath="/admin/customers" searchParams={params} nextCursor={nextCursor} />
    </>
  );
}
