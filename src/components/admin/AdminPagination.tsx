import Link from 'next/link';
import { nextPageHref, prevPageHref, getParamArray, type SearchParamsInput } from '@/lib/utils/query-params';
import { smallButtonClass } from './styles';

export function AdminPagination({
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
    <nav className="mt-4 flex items-center justify-between" aria-label="Pagination">
      {hasPrev ? (
        <Link href={basePath + prevPageHref(searchParams)} className={smallButtonClass}>
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      {nextCursor ? (
        <Link href={basePath + nextPageHref(searchParams, nextCursor)} className={smallButtonClass}>
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
