import type { Metadata } from 'next';
import { ShopListingPage } from '@/components/shop/ShopListingPage';
import type { SearchParamsInput } from '@/lib/utils/query-params';

export const metadata: Metadata = { title: 'Shop All' };

export default async function ShopAllPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const params = await searchParams;
  return (
    <ShopListingPage
      title="Shop All"
      description="Every piece in the current catalog — tees, hoodies, sweatshirts, and everything in between."
      basePath="/shop"
      searchParams={params}
    />
  );
}
