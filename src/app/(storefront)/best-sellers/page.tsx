import type { Metadata } from 'next';
import { ShopListingPage } from '@/components/shop/ShopListingPage';
import type { SearchParamsInput } from '@/lib/utils/query-params';

export const metadata: Metadata = { title: 'Best Sellers' };

export default async function BestSellersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const params = await searchParams;
  return (
    <ShopListingPage
      title="Best Sellers"
      description="Ranked by real sales — what the culture is actually buying."
      basePath="/best-sellers"
      searchParams={params}
      defaults={{ sort: 'best_selling' }}
    />
  );
}
