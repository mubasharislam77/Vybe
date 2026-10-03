import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShopListingPage } from '@/components/shop/ShopListingPage';
import { getCollectionBySlug } from '@/lib/repositories/collections.repo';
import type { SearchParamsInput } from '@/lib/utils/query-params';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  return { title: collection?.name ?? 'Collection' };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParamsInput>;
}) {
  const { slug } = await params;
  const [collection, resolvedSearchParams] = await Promise.all([getCollectionBySlug(slug), searchParams]);
  if (!collection || !collection.isActive) notFound();

  return (
    <ShopListingPage
      title={collection.name}
      description={collection.description}
      basePath={`/collections/${slug}`}
      searchParams={resolvedSearchParams}
      forced={{ collection: slug }}
    />
  );
}
