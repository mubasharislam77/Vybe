import Link from 'next/link';
import { nextPageHref, prevPageHref, getParamArray, type SearchParamsInput } from '@/lib/utils/query-params';

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
    <nav className="flex items-center justify-between border-t border-ink/10 pt-6" aria-label="Pagination">
      {hasPrev ? (
        <Link href={basePath + prevPageHref(searchParams)} className="text-sm underline-offset-4 hover:underline">
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      {nextCursor ? (
        <Link href={basePath + nextPageHref(searchParams, nextCursor)} className="text-sm underline-offset-4 hover:underline">
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
