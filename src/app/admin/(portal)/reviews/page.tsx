import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStaffPage } from '@/lib/auth/session';
import { listReviewsForAdmin, countReviewsByStatus } from '@/lib/repositories/reviews.repo';
import { getProductsByIds } from '@/lib/repositories/products.repo';
import { deleteReview, moderateReview } from '@/lib/actions/admin/reviews.actions';
import { formatDateTime } from '@/lib/utils/dates';
import { getParam, type SearchParamsInput } from '@/lib/utils/query-params';
import { PageHeader } from '@/components/admin/PageHeader';
import { ActionButton } from '@/components/admin/ActionButton';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { EmptyState } from '@/components/admin/EmptyState';
import { panelClass, smallButtonClass } from '@/components/admin/styles';
import type { Review } from '@/types/domain';

export const metadata: Metadata = { title: 'Reviews' };

const TABS: { value: Review['status'] | 'all'; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<SearchParamsInput> }) {
  const user = await requireStaffPage();
  const params = await searchParams;
  const raw = getParam(params, 'status');
  const status: Review['status'] | 'all' = raw === 'approved' || raw === 'rejected' || raw === 'all' ? raw : 'pending';

  const [reviews, counts] = await Promise.all([listReviewsForAdmin(status === 'all' ? undefined : status), countReviewsByStatus()]);
  const products = await getProductsByIds(Array.from(new Set(reviews.map((r) => r.productId.toString()))).map((id) => reviews.find((r) => r.productId.toString() === id)!.productId));

  return (
    <>
      <PageHeader title="Reviews" description="Customer reviews are hidden until approved. Approved reviews show on the product page." />
      <div className="mb-4 flex flex-wrap gap-1">
        {TABS.map((tab) => {
          const active = tab.value === status;
          const count = tab.value === 'all' ? counts.pending + counts.approved + counts.rejected : counts[tab.value];
          return (
            <Link key={tab.value} href={`/admin/reviews?status=${tab.value}`} className={`${smallButtonClass} ${active ? 'border-ink bg-ink text-ivory' : ''}`} aria-current={active ? 'page' : undefined}>
              {tab.label} <span className="opacity-70">({count})</span>
            </Link>
          );
        })}
      </div>

      {reviews.length === 0 ? (
        <div className={panelClass}>
          <EmptyState title={status === 'pending' ? 'Nothing to moderate' : 'No reviews here'} />
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((r) => {
            const id = r._id.toString();
            const product = products.get(r.productId.toString());
            return (
              <li key={id} className={`${panelClass} p-5`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lime-dark" aria-label={`${r.rating} out of 5`}>
                        {'★'.repeat(r.rating)}
                        <span className="text-ink/20">{'★'.repeat(5 - r.rating)}</span>
                      </span>
                      <StatusBadge status={r.status} />
                      {r.verifiedPurchase && <StatusBadge status="verified" label="Verified purchase" />}
                    </div>
                    {r.title && <p className="mt-2 font-medium text-ink">{r.title}</p>}
                    <p className="mt-1 whitespace-pre-line text-sm text-ink-600">{r.body}</p>
                    <p className="mt-2 text-xs text-ink-400">
                      {r.customerName} · {formatDateTime(r.createdAt)} · on{' '}
                      {product ? (
                        <Link href={`/admin/products/${product._id.toString()}/edit`} className="underline underline-offset-4 hover:text-ink">
                          {product.title}
                        </Link>
                      ) : (
                        <span>deleted product</span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {r.status !== 'approved' && (
                      <ActionButton action={moderateReview.bind(null, { id, status: 'approved' })} variant="primary">
                        Approve
                      </ActionButton>
                    )}
                    {r.status !== 'rejected' && (
                      <ActionButton action={moderateReview.bind(null, { id, status: 'rejected' })}>
                        Reject
                      </ActionButton>
                    )}
                    {user.role === 'admin' && (
                      <ActionButton action={deleteReview.bind(null, id)} variant="danger" confirm="Delete this review permanently?">
                        Delete
                      </ActionButton>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
