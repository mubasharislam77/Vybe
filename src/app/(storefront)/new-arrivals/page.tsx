import type { Metadata } from 'next';
import { ShopListingPage } from '@/components/shop/ShopListingPage';
import type { SearchParamsInput } from '@/lib/utils/query-params';

export const metadata: Metadata = { title: 'New Arrivals' };

export default async function NewArrivalsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const params = await searchParams;
  return (
    <ShopListingPage
      title="New Arrivals"
      description="Fresh off the line — the latest drops first."
      basePath="/new-arrivals"
      searchParams={params}
      defaults={{ sort: 'newest' }}
    />
  );
}
