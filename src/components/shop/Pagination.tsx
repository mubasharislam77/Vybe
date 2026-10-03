import Link from 'next/link';
import { nextPageHref, prevPageHref, getParamArray, type SearchParamsInput } from '@/lib/utils/query-params';

const linkClass =
  'inline-flex min-h-[44px] items-center gap-2 border border-ink/20 px-6 font-display text-xs uppercase tracking-widest2 text-ink transition-colors hover:border-ink hover:bg-ink hover:text-ivory';

/** Server-rendered keyset pagination — no client JS required. A bounded "previous" stack lives in the URL (prevCursors), not unlimited deep-skip. */
export function Pagination({
  basePath,
  searchParams,
  nextCursor,
}: {
  basePath: string;
  searchParams: SearchParamsInput;
  nextCursor: string | null;
}) {
  const hasPrev = Boolean(searchParams.cursor) || getParamArray(searchParams, 'prevCursors').length > 0;

  if (!hasPrev && !nextCursor) return null;

  return (
    <nav className="flex items-center justify-between border-t border-ink/10 pt-8" aria-label="Pagination">
      {hasPrev ? (
        <Link href={basePath + prevPageHref(searchParams)} className={linkClass}>
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      {nextCursor ? (
        <Link href={basePath + nextPageHref(searchParams, nextCursor)} className={linkClass}>
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
