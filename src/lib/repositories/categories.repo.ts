import { ObjectId } from 'mongodb';
import { categories } from '@/lib/db/collections';
import type { Category } from '@/types/domain';
import type { CategoryInput } from '@/lib/validation/category';

export async function listCategoryTree(): Promise<Category[]> {
  const col = await categories();
  return col.find({}).sort({ order: 1, name: 1 }).toArray();
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const col = await categories();
  return col.findOne({ slug });
}

export async function getCategoryById(id: string): Promise<Category | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await categories();
  return col.findOne({ _id: new ObjectId(id) });
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const col = await categories();
  const now = new Date();
  const doc: Omit<Category, '_id'> = {
    slug: input.slug,
    name: input.name,
    parentId: input.parentId ? new ObjectId(input.parentId) : null,
    order: input.order,
    description: input.description,
    imageUrl: input.imageUrl,
    createdAt: now,
    updatedAt: now,
  };
  const result = await col.insertOne(doc as Category);
  return { ...doc, _id: result.insertedId } as Category;
}

export async function updateCategory(id: string, input: CategoryInput): Promise<void> {
  const col = await categories();
  await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        slug: input.slug,
        name: input.name,
        parentId: input.parentId ? new ObjectId(input.parentId) : null,
        order: input.order,
        description: input.description,
        imageUrl: input.imageUrl,
        updatedAt: new Date(),
      },
    },
  );
}

export async function deleteCategory(id: string): Promise<void> {
  const col = await categories();
  await col.deleteOne({ _id: new ObjectId(id) });
}
