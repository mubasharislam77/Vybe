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
import { AmbientScrollProvider } from '@/components/ui/AmbientScrollProvider';
import { ScrollSpin, ScrollDrift } from '@/components/ui/ScrollMotion';
import { RingShape, DiamondShape } from '@/components/ui/Shapes';
import { RevealOnScroll } from '@/components/ui/ScrollReveal';
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
    <AmbientScrollProvider>
      <div className="relative overflow-hidden border-b border-ink/10 bg-ivory">
        <ScrollSpin factor={0.05} className="absolute -right-16 -top-16 z-0 hidden lg:block">
          <RingShape size={240} color="burgundy" opacity={0.08} />
        </ScrollSpin>
        <ScrollDrift factor={-0.1} axis="y" className="absolute left-[4%] top-1/2 z-0 hidden sm:block">
          <DiamondShape size={16} color="lime" opacity={0.6} />
        </ScrollDrift>

        <Container className="relative py-12 lg:py-20">
          <RevealOnScroll y={16}>
            <p className="mb-3 font-display text-xs uppercase tracking-widest2 text-burgundy">The Full Range</p>
            <h1 className="font-display text-5xl uppercase tracking-tight text-ink sm:text-6xl lg:text-7xl">
              {title}
            </h1>
            {description && <p className="mt-4 max-w-xl text-base text-ink-600">{description}</p>}
          </RevealOnScroll>
        </Container>
      </div>

      <Container className="py-8 lg:py-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="flex items-center gap-2 text-sm text-ink-600">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden="true" />
            {products.length} shown
          </p>
          <div className="flex items-center gap-3">
            <FilterDrawer basePath={basePath} options={facets} />
            <SortSelect basePath={basePath} />
          </div>
        </div>

        <AppliedFilterChips basePath={basePath} />

        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <FilterPanel basePath={basePath} options={facets} />
            </div>
          </aside>
          <div className="flex flex-col gap-12">
            <ProductGrid products={products} />
            <Pagination basePath={basePath} searchParams={searchParams} nextCursor={nextCursor} />
          </div>
        </div>
      </Container>
    </AmbientScrollProvider>
  );
}
