import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStaffPage } from '@/lib/auth/session';
import { listAuditLogs, listDistinctAuditTargetTypes } from '@/lib/repositories/audit.repo';
import { listStaffUsers } from '@/lib/repositories/staff.repo';
import { formatDateTime } from '@/lib/utils/dates';
import { getParam, type SearchParamsInput } from '@/lib/utils/query-params';
import { PageHeader } from '@/components/admin/PageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { JsonDetails } from '@/components/admin/JsonDetails';
import { tableWrapClass, tableClass, tdClass, thClass, inputClass, smallButtonClass } from '@/components/admin/styles';

export const metadata: Metadata = { title: 'Audit log' };

const PAGE = 50;

function targetHref(targetType: string, targetId: string): string | null {
  switch (targetType) {
    case 'order':
      return `/admin/orders/${targetId}`;
    case 'product':
      return `/admin/products/${targetId}/edit`;
    case 'staff':
      return '/admin/staff';
    case 'coupon':
      return '/admin/coupons';
    case 'category':
      return '/admin/categories';
    case 'collection':
      return '/admin/collections';
    case 'review':
      return '/admin/reviews?status=all';
    case 'settings':
      return '/admin/settings';
    case 'notification':
      return '/admin/notifications';
    default:
      return null;
  }
}

export default async function AdminAuditLogPage({ searchParams }: { searchParams: Promise<SearchParamsInput> }) {
  await requireStaffPage('admin');
  const params = await searchParams;
  const targetType = getParam(params, 'type') || undefined;
  const actorId = getParam(params, 'actor') || undefined;
  const beforeRaw = getParam(params, 'before');
  const before = beforeRaw ? new Date(beforeRaw) : undefined;

  const [entries, types, staff] = await Promise.all([
    listAuditLogs({ targetType, actorId, before: before && !Number.isNaN(before.getTime()) ? before : undefined, limit: PAGE }),
    listDistinctAuditTargetTypes(),
    listStaffUsers(),
  ]);
  const last = entries.at(-1);
  const olderHref = entries.length === PAGE && last ? `/admin/audit-log?${new URLSearchParams({ ...(targetType ? { type: targetType } : {}), ...(actorId ? { actor: actorId } : {}), before: last.at.toISOString() }).toString()}` : null;

  return (
    <>
      <PageHeader title="Audit log" description="Every change made through this portal, by whom, and when. Records are append-only." />
      <form action="/admin/audit-log" method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest2 text-ink-400">Record type</span>
          <select name="type" defaultValue={targetType ?? ''} className={`${inputClass} w-auto min-w-[150px]`}>
            <option value="">All</option>
            {types.sort().map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest2 text-ink-400">Staff member</span>
          <select name="actor" defaultValue={actorId ?? ''} className={`${inputClass} w-auto min-w-[180px]`}>
            <option value="">Anyone</option>
            {staff.map((s) => (
              <option key={s._id.toString()} value={s._id.toString()}>
                {s.fullName}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={`${smallButtonClass} min-h-[40px]`}>
          Apply
        </button>
        {(targetType || actorId || beforeRaw) && (
          <Link href="/admin/audit-log" className={`${smallButtonClass} min-h-[40px] border-transparent`}>
            Clear
          </Link>
        )}
      </form>

      <div className={tableWrapClass}>
        {entries.length === 0 ? (
          <EmptyState title="No audit entries" hint="Actions taken in the admin portal will appear here." />
        ) : (
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>When</th>
                <th className={thClass}>Who</th>
                <th className={thClass}>Action</th>
                <th className={thClass}>Record</th>
                <th className={thClass}>Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((a) => {
                const href = targetHref(a.targetType, a.targetId);
                return (
                  <tr key={a._id.toString()} className="align-top hover:bg-ivory/60">
                    <td className={`${tdClass} whitespace-nowrap text-xs text-ink-600`}>{formatDateTime(a.at)}</td>
                    <td className={`${tdClass} text-xs`}>{a.actorEmail}</td>
                    <td className={`${tdClass} font-medium`}>{a.action.replace(/[._]/g, ' ')}</td>
                    <td className={`${tdClass} text-xs`}>
                      <span className="uppercase tracking-widest2 text-ink-400">{a.targetType}</span>{' '}
                      {href ? (
                        <Link href={href} className="font-mono text-ink underline-offset-4 hover:underline">
                          {a.targetId.slice(-8)}
                        </Link>
                      ) : (
                        <span className="font-mono">{a.targetId.slice(-8)}</span>
                      )}
                    </td>
                    <td className={tdClass}>
                      <JsonDetails value={a.diff} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {olderHref && (
        <div className="mt-4 flex justify-end">
          <Link href={olderHref} className={smallButtonClass}>
            Older entries →
          </Link>
        </div>
      )}
    </>
  );
}
