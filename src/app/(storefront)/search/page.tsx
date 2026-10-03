import type { Metadata } from 'next';
import { ShopListingPage } from '@/components/shop/ShopListingPage';
import type { SearchParamsInput } from '@/lib/utils/query-params';

export const metadata: Metadata = { title: 'Search' };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';

  return (
    <ShopListingPage
      title={q ? `Results for "${q}"` : 'Search'}
      basePath="/search"
      searchParams={params}
      defaults={{ sort: 'relevance' }}
    />
  );
}
