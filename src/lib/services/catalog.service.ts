import { listCategoryTree } from '@/lib/repositories/categories.repo';
import type { Category } from '@/types/domain';
import type { ListingItem } from '@/lib/repositories/products.repo';
import type { ProductCardData } from '@/components/ui/ProductCard';

export interface CategoryNavNode {
  slug: string;
  name: string;
  children: { slug: string; name: string }[];
}

export async function getCategoryNav(): Promise<CategoryNavNode[]> {
  const all = await listCategoryTree();
  const byParent = new Map<string, Category[]>();
  for (const cat of all) {
    const key = cat.parentId ? cat.parentId.toString() : 'root';
    byParent.set(key, [...(byParent.get(key) ?? []), cat]);
  }
  const roots = byParent.get('root') ?? [];
  return roots.map((root) => ({
    slug: root.slug,
    name: root.name,
    children: (byParent.get(root._id.toString()) ?? []).map((c) => ({ slug: c.slug, name: c.name })),
  }));
}

export function toProductCardData(item: ListingItem): ProductCardData {
  return {
    slug: item.slug,
    title: item.title,
    imageUrl: item.images[0]?.url ?? '/products/tee-01.jpg',
    imageAlt: item.images[0]?.alt ?? item.title,
    minPriceMinor: item.matchedMinPrice,
    maxPriceMinor: item.matchedMaxPrice,
    compareAtMinor: item.matchedCompareAtMinPrice ?? null,
    featured: item.featured,
    fulfillment: item.fulfillment,
  };
}
