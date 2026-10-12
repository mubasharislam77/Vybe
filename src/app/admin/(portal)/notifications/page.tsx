import type { Metadata } from 'next';
import Link from 'next/link';
import { listNotificationsForAdmin, countNotificationsByStatus } from '@/lib/repositories/notifications.repo';
import { getIntegrationHealth } from '@/lib/services/dashboard.service';
import { formatDateTime, relativeTime } from '@/lib/utils/dates';
import { getParam, type SearchParamsInput } from '@/lib/utils/query-params';
import { PageHeader } from '@/components/admin/PageHeader';
import { RetryNotificationButton, RunWorkerButton } from '@/components/admin/NotificationActions';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { EmptyState } from '@/components/admin/EmptyState';
import { StatCard } from '@/components/admin/StatCard';
import { tableWrapClass, tableClass, tdClass, thClass, smallButtonClass } from '@/components/admin/styles';
import type { NotificationStatus } from '@/types/domain';

export const metadata: Metadata = { title: 'Notifications' };

const STATUSES: NotificationStatus[] = ['pending', 'provider_accepted', 'delivered', 'failed'];

export default async function AdminNotificationsPage({ searchParams }: { searchParams: Promise<SearchParamsInput> }) {
  const params = await searchParams;
  const raw = getParam(params, 'status');
  const status = STATUSES.includes(raw as NotificationStatus) ? (raw as NotificationStatus) : undefined;

  const [entries, counts] = await Promise.all([listNotificationsForAdmin({ status, limit: 100 }), countNotificationsByStatus()]);
  const health = getIntegrationHealth().filter((h) => h.key === 'email' || h.key === 'whatsapp');

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Every order writes one outbox entry per channel. Entries send right after checkout, and the cron backstop retries anything that failed."
        actions={<RunWorkerButton />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATUSES.map((s) => (
          <StatCard key={s} label={s.replace(/_/g, ' ')} value={counts[s]} href={`/admin/notifications?status=${s}`} tone={s === 'failed' && counts[s] > 0 ? 'alert' : 'default'} />
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-ink-600">
        {health.map((h) => (
          <span key={h.key} className="inline-flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${h.configured ? 'bg-lime-dark' : 'bg-burgundy'}`} aria-hidden="true" />
            {h.label}: {h.configured ? 'configured' : 'not configured'}
          </span>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-1">
        <Link href="/admin/notifications" className={`${smallButtonClass} ${!status ? 'border-ink bg-ink text-ivory' : ''}`}>
          All
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/notifications?status=${s}`} className={`${smallButtonClass} ${status === s ? 'border-ink bg-ink text-ivory' : ''}`}>
            {s.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      <div className={tableWrapClass}>
        {entries.length === 0 ? (
          <EmptyState title="No notifications" />
        ) : (
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Order</th>
                <th className={thClass}>Channel</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Attempts</th>
                <th className={thClass}>Next attempt</th>
                <th className={thClass}>Last error</th>
                <th className={thClass}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((n) => {
                const id = n._id.toString();
                const retryable = n.status === 'failed' || n.status === 'pending';
                return (
                  <tr key={id} className="align-top hover:bg-ivory/60">
                    <td className={tdClass}>
                      <Link href={`/admin/orders/${n.orderId.toString()}`} className="font-mono text-xs font-semibold text-ink underline-offset-4 hover:underline">
                        {n.orderNumber}
                      </Link>
                      <span className="block text-[11px] text-ink-400">{formatDateTime(n.createdAt)}</span>
                    </td>
                    <td className={`${tdClass} uppercase`}>{n.channel}</td>
                    <td className={tdClass}>
                      <StatusBadge status={n.status} />
                      {n.providerMessageId && <span className="mt-1 block max-w-[160px] truncate font-mono text-[10px] text-ink-400">{n.providerMessageId}</span>}
                    </td>
                    <td className={tdClass}>
                      {n.attempts}/{n.maxAttempts}
                    </td>
                    <td className={`${tdClass} text-xs text-ink-600`}>{n.status === 'pending' ? relativeTime(n.nextAttemptAt) : '—'}</td>
                    <td className={`${tdClass} max-w-xs text-xs text-burgundy`}>{n.lastError ?? <span className="text-ink-400">—</span>}</td>
                    <td className={tdClass}>
                      {retryable && <RetryNotificationButton id={id} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
