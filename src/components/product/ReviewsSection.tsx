import { listApprovedReviews } from '@/lib/repositories/reviews.repo';
import { ReviewForm } from './ReviewForm';
import { Badge } from '@/components/ui/Badge';

export async function ReviewsSection({ productId }: { productId: string }) {
  const reviews = await listApprovedReviews(productId);
  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <section className="border-t border-ink/10 py-16">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <div>
          <h2 className="mb-6 font-display text-2xl uppercase tracking-widest2 text-ink">
            Reviews {average && <span className="text-ink-400">({average} ★, {reviews.length})</span>}
          </h2>

          {reviews.length === 0 ? (
            <p className="text-sm text-ink-400">No reviews yet — be the first.</p>
          ) : (
            <ul className="flex flex-col gap-6">
              {reviews.map((r) => (
                <li key={r._id.toString()} className="border-b border-ink/10 pb-6">
                  <div className="mb-1 flex items-center gap-2">
                    <span aria-label={`${r.rating} out of 5 stars`} className="text-lime">
                      {'★'.repeat(r.rating)}
                      <span className="text-ink/20">{'★'.repeat(5 - r.rating)}</span>
                    </span>
                    {r.verifiedPurchase && <Badge tone="outline">Verified purchase</Badge>}
                  </div>
                  {r.title && <p className="font-medium text-ink">{r.title}</p>}
                  <p className="mt-1 text-sm text-ink-600">{r.body}</p>
                  <p className="mt-2 text-xs text-ink-400">{r.customerName}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm uppercase tracking-widest2 text-ink">Write a Review</h3>
          <ReviewForm productId={productId} />
        </div>
      </div>
    </section>
  );
}
