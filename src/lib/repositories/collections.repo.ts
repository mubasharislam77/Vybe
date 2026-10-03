import { ObjectId } from 'mongodb';
import { productCollections } from '@/lib/db/collections';
import type { ProductCollection } from '@/types/domain';
import type { CollectionInput } from '@/lib/validation/category';

export async function listActiveCollections(): Promise<ProductCollection[]> {
  const col = await productCollections();
  return col.find({ isActive: true }).sort({ startsAt: -1 }).toArray();
}

export async function listAllCollectionsForAdmin(): Promise<ProductCollection[]> {
  const col = await productCollections();
  return col.find({}).sort({ createdAt: -1 }).toArray();
}

export async function getCollectionBySlug(slug: string): Promise<ProductCollection | null> {
  const col = await productCollections();
  return col.findOne({ slug });
}

export async function createCollection(input: CollectionInput): Promise<ProductCollection> {
  const col = await productCollections();
  const now = new Date();
  const doc: Omit<ProductCollection, '_id'> = {
    slug: input.slug,
    name: input.name,
    description: input.description,
    bannerImageUrl: input.bannerImageUrl,
    isActive: input.isActive,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    createdAt: now,
    updatedAt: now,
  };
  const result = await col.insertOne(doc as ProductCollection);
  return { ...doc, _id: result.insertedId } as ProductCollection;
}

export async function updateCollection(id: string, input: CollectionInput): Promise<void> {
  const col = await productCollections();
  await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        bannerImageUrl: input.bannerImageUrl,
        isActive: input.isActive,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        updatedAt: new Date(),
      },
    },
  );
}

export async function deleteCollection(id: string): Promise<void> {
  const col = await productCollections();
  await col.deleteOne({ _id: new ObjectId(id) });
}
