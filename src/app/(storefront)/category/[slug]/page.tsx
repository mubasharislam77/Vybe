import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShopListingPage } from '@/components/shop/ShopListingPage';
import { getCategoryBySlug } from '@/lib/repositories/categories.repo';
import type { SearchParamsInput } from '@/lib/utils/query-params';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return { title: category?.name ?? 'Category' };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParamsInput>;
}) {
  const { slug } = await params;
  const [category, resolvedSearchParams] = await Promise.all([getCategoryBySlug(slug), searchParams]);
  if (!category) notFound();

  return (
    <ShopListingPage
      title={category.name}
      description={category.description}
      basePath={`/category/${slug}`}
      searchParams={resolvedSearchParams}
      forced={{ category: slug }}
    />
  );
}
