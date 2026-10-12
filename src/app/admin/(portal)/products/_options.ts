import { listCategoryTree } from '@/lib/repositories/categories.repo';
import { listAllCollectionsForAdmin } from '@/lib/repositories/collections.repo';

/** Category/collection choices for the product form, with child categories grouped under their parent. */
export async function loadProductFormOptions() {
  const [categories, collections] = await Promise.all([listCategoryTree(), listAllCollectionsForAdmin()]);
  const byId = new Map(categories.map((c) => [c._id.toString(), c]));
  return {
    categories: categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      group: c.parentId ? byId.get(c.parentId.toString())?.name : undefined,
    })),
    collections: collections.map((c) => ({ id: c._id.toString(), name: c.isActive ? c.name : `${c.name} (inactive)` })),
  };
}
