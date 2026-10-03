import { listProducts, getFilterFacets } from '@/lib/repositories/products.repo';
import { listingQuerySchema, type ListingQuery } from '@/lib/validation/product';
import { toProductCardData } from '@/lib/services/catalog.service';
import { ProductGrid } from './ProductGrid';
import { Pagination } from './Pagination';
import { SortSelect } from './SortSelect';
import { FilterPanel } from './FilterPanel';
import { FilterDrawer } from './FilterDrawer';
import { AppliedFilterChips } from './AppliedFilterChips';
import { Container } from '@/components/ui/Container';
import type { SearchParamsInput } from '@/lib/utils/query-params';

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key as keyof T] = value as T[keyof T];
  }
  return out;
}

export async function ShopListingPage({
  title,
  description,
  basePath,
  searchParams,
  forced,
  defaults,
}: {
  title: string;
  description?: string;
  basePath: string;
  searchParams: SearchParamsInput;
  /** Always wins over the URL — for constraints the route itself dictates (e.g. a category page's category). */
  forced?: Partial<ListingQuery>;
  /** Used only when the user hasn't set that field via the URL — e.g. "best sellers" default sort, still overridable. */
  defaults?: Partial<ListingQuery>;
}) {
  // Omit keys entirely when absent from the URL — `{...a, key: undefined}`
  // would otherwise clobber a default even though the user never set it,
  // since the key is present either way in a shallow spread.
  const rawFromUrl = stripUndefined({
    category: searchParams.category,
    collection: searchParams.collection,
    audience: searchParams.audience,
    tag: searchParams.tag,
    size: searchParams.size,
    color: searchParams.color,
    fit: searchParams.fit,
    minPriceMinor: searchParams.minPriceMinor,
    maxPriceMinor: searchParams.maxPriceMinor,
    availability: searchParams.availability,
    onSale: searchParams.onSale,
    q: searchParams.q,
    sort: searchParams.sort,
    cursor: searchParams.cursor,
    pageSize: searchParams.pageSize,
  });

  const parsed = listingQuerySchema.safeParse({ ...defaults, ...rawFromUrl, ...forced });
  const query: ListingQuery = parsed.success ? parsed.data : listingQuerySchema.parse({});

  const [{ items, nextCursor }, facets] = await Promise.all([listProducts(query), getFilterFacets()]);
  const products = items.map(toProductCardData);

  return (
    <Container className="py-10 lg:py-16">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-display text-4xl uppercase tracking-tight text-ink sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 text-ink-600">{description}</p>}
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-ink-400">{products.length} shown</p>
        <div className="flex items-center gap-3">
          <FilterDrawer basePath={basePath} options={facets} />
          <SortSelect basePath={basePath} />
        </div>
      </div>

      <AppliedFilterChips basePath={basePath} />

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <FilterPanel basePath={basePath} options={facets} />
        </aside>
        <div className="flex flex-col gap-10">
          <ProductGrid products={products} />
          <Pagination basePath={basePath} searchParams={searchParams} nextCursor={nextCursor} />
        </div>
      </div>
    </Container>
  );
}
