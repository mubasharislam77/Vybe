import type { Metadata } from 'next';
import { ShopListingPage } from '@/components/shop/ShopListingPage';
import type { SearchParamsInput } from '@/lib/utils/query-params';

export const metadata: Metadata = { title: 'Sale' };

export default async function SalePage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const params = await searchParams;
  return (
    <ShopListingPage
      title="Sale"
      description="Marked-down pieces while stock lasts."
      basePath="/sale"
      searchParams={params}
      forced={{ onSale: true }}
    />
  );
}
