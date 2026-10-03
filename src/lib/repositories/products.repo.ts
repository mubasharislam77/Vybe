import { ObjectId, type ClientSession, type Document, type Filter } from 'mongodb';
import { products, categories, productCollections } from '@/lib/db/collections';
import type { Product } from '@/types/domain';
import type { ListingQuery } from '@/lib/validation/product';
import { clampPageSize, decodeCursor, encodeCursor, keysetFilter } from '@/lib/utils/pagination';

/**
 * Variant-price semantics (applies consistently to display, filtering, and
 * sorting — see spec section 5):
 *
 *   "matchedVariants" = the subset of a product's variants that satisfy
 *   every variant-level filter in the query (size, color, price range,
 *   availability) simultaneously, via a single combined condition — NOT
 *   independent per-field checks. A product is included in results only if
 *   at least one variant matches all of them at once.
 *
 *   "matchedMinPrice" / "matchedMaxPrice" = min/max priceMinor across
 *   matchedVariants. This is the price shown on listing cards AND the value
 *   used for price_asc/price_desc sort — so the number a shopper sees next
 *   to a filtered product is always the one that drove the sort/filter,
 *   never an unrelated variant's price.
 *
 *   With no size/color/price filter active, matchedVariants = all variants,
 *   so matchedMinPrice is simply the product's "starting at" price.
 */

export interface ListingItem {
  _id: ObjectId;
  slug: string;
  title: string;
  images: Product['images'];
  audience: Product['audience'];
  tags: string[];
  featured: boolean;
  fulfillment: Product['fulfillment'];
  salesCount: number;
  createdAt: Date;
  matchedMinPrice: number;
  matchedMaxPrice: number;
  matchedCompareAtMinPrice: number | null;
}

export interface ListingResult {
  items: ListingItem[];
  nextCursor: string | null;
}

async function resolveCategoryId(slug: string | undefined): Promise<ObjectId | null> {
  if (!slug) return null;
  const col = await categories();
  const doc = await col.findOne({ slug }, { projection: { _id: 1 } });
  return doc?._id ?? null;
}

async function resolveCollectionId(slug: string | undefined): Promise<ObjectId | null> {
  if (!slug) return null;
  const col = await productCollections();
  const doc = await col.findOne({ slug }, { projection: { _id: 1 } });
  return doc?._id ?? null;
}

function variantMatchCondition(query: ListingQuery): Record<string, unknown> {
  const clauses: Record<string, unknown>[] = [];

  if (query.size?.length) {
    clauses.push({ $in: ['$$this.size', query.size] });
  }
  if (query.color?.length) {
    clauses.push({ $in: ['$$this.colorName', query.color] });
  }
  if (query.minPriceMinor !== undefined) {
    clauses.push({ $gte: ['$$this.priceMinor', query.minPriceMinor] });
  }
  if (query.maxPriceMinor !== undefined) {
    clauses.push({ $lte: ['$$this.priceMinor', query.maxPriceMinor] });
  }
  if (query.availability === 'in_stock') {
    clauses.push({ $or: [{ $eq: ['$fulfillment', 'made_to_order'] }, { $gt: ['$$this.stock', 0] }] });
  } else if (query.availability === 'made_to_order') {
    clauses.push({ $eq: ['$fulfillment', 'made_to_order'] });
  }
  if (query.onSale) {
    clauses.push({
      $and: [{ $ne: ['$$this.compareAtPriceMinor', null] }, { $gt: ['$$this.compareAtPriceMinor', '$$this.priceMinor'] }],
    });
  }

  if (clauses.length === 0) return { $literal: true };
  return clauses.length === 1 ? clauses[0] : { $and: clauses };
}

function sortField(sort: ListingQuery['sort']): { field: string; dir: 1 | -1 } {
  switch (sort) {
    case 'price_asc':
      return { field: 'matchedMinPrice', dir: 1 };
    case 'price_desc':
      return { field: 'matchedMinPrice', dir: -1 };
    case 'best_selling':
      return { field: 'salesCount', dir: -1 };
    case 'newest':
    default:
      return { field: 'createdAt', dir: -1 };
  }
}

export async function listProducts(query: ListingQuery): Promise<ListingResult> {
  const col = await products();
  const pageSize = clampPageSize(query.pageSize);

  const scalarMatch: Filter<Product> = { status: 'published' };

  const [categoryId, collectionId] = await Promise.all([
    resolveCategoryId(query.category),
    resolveCollectionId(query.collection),
  ]);
  if (query.category) {
    if (!categoryId) return { items: [], nextCursor: null };
    scalarMatch.categoryIds = categoryId;
  }
  if (query.collection) {
    if (!collectionId) return { items: [], nextCursor: null };
    scalarMatch.collectionIds = collectionId;
  }
  if (query.audience) scalarMatch.audience = query.audience;
  if (query.tag) scalarMatch.tags = query.tag;

  const pipeline: Document[] = [];

  const useTextSearch = Boolean(query.q);
  if (useTextSearch) {
    pipeline.push({ $match: { ...scalarMatch, $text: { $search: query.q! } } });
    pipeline.push({ $addFields: { textScore: { $meta: 'textScore' } } });
  } else {
    pipeline.push({ $match: scalarMatch });
  }

  pipeline.push({
    $addFields: {
      matchedVariants: {
        $filter: { input: '$variants', as: 'this', cond: variantMatchCondition(query) },
      },
    },
  });
  pipeline.push({ $match: { matchedVariants: { $ne: [] } } });
  pipeline.push({
    $addFields: {
      matchedMinPrice: { $min: '$matchedVariants.priceMinor' },
      matchedMaxPrice: { $max: '$matchedVariants.priceMinor' },
      matchedCompareAtMinPrice: { $min: '$matchedVariants.compareAtPriceMinor' },
    },
  });

  const { field, dir } = useTextSearch && !query.sort
    ? { field: 'textScore', dir: -1 as const }
    : sortField(query.sort);

  const cursor = decodeCursor(query.cursor);
  if (cursor) {
    pipeline.push({ $match: keysetFilter(field, dir, cursor, field === 'createdAt') });
  }

  pipeline.push({ $sort: { [field]: dir, _id: dir } });
  pipeline.push({ $limit: pageSize + 1 });
  pipeline.push({
    $project: {
      slug: 1,
      title: 1,
      images: 1,
      audience: 1,
      tags: 1,
      featured: 1,
      fulfillment: 1,
      salesCount: 1,
      createdAt: 1,
      matchedMinPrice: 1,
      matchedMaxPrice: 1,
      matchedCompareAtMinPrice: 1,
    },
  });

  const docs = (await col.aggregate(pipeline).toArray()) as unknown as (ListingItem & { [key: string]: unknown })[];

  const hasMore = docs.length > pageSize;
  const page = hasMore ? docs.slice(0, pageSize) : docs;
  const last = page.at(-1);
  const nextCursor =
    hasMore && last
      ? encodeCursor({ value: last[field] as string | number, id: last._id.toString() })
      : null;

  return { items: page, nextCursor };
}

export interface FilterFacets {
  sizes: string[];
  colors: { name: string; hex: string }[];
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export async function getFilterFacets(): Promise<FilterFacets> {
  const col = await products();
  const [sizes, colorDocs] = await Promise.all([
    col.distinct('variants.size', { status: 'published' }),
    col
      .aggregate([
        { $match: { status: 'published' } },
        { $unwind: '$variants' },
        { $group: { _id: '$variants.colorName', hex: { $first: '$variants.colorSwatchHex' } } },
      ])
      .toArray(),
  ]);

  return {
    sizes: (sizes as string[]).sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b)),
    colors: colorDocs.map((d) => ({ name: d._id as string, hex: d.hex as string })),
  };
}

export async function getDistinctTags(): Promise<string[]> {
  const col = await products();
  const tags = await col.distinct('tags', { status: 'published' });
  return (tags as string[]).sort();
}

export async function countPublishedProducts(): Promise<number> {
  const col = await products();
  return col.countDocuments({ status: 'published' });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const col = await products();
  return col.findOne({ slug, status: 'published' });
}

export async function getProductBySlugForAdmin(slug: string): Promise<Product | null> {
  const col = await products();
  return col.findOne({ slug });
}

/** Reads within the checkout transaction's session for snapshot-consistent price/stock. */
export async function getProductByVariantSku(sku: string, session: ClientSession): Promise<Product | null> {
  const col = await products();
  return col.findOne({ 'variants.sku': sku, status: 'published' }, { session });
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await products();
  return col.findOne({ _id: new ObjectId(id) });
}

export async function getRelatedProducts(product: Product, limit = 8): Promise<Product[]> {
  const col = await products();
  return col
    .find({
      status: 'published',
      _id: { $ne: product._id },
      $or: [{ categoryIds: { $in: product.categoryIds } }, { tags: { $in: product.tags } }],
    })
    .limit(limit)
    .toArray();
}

export async function listFeatured(limit = 8): Promise<Product[]> {
  const col = await products();
  return col.find({ status: 'published', featured: true }).sort({ createdAt: -1 }).limit(limit).toArray();
}

export async function listNewArrivals(limit = 8): Promise<Product[]> {
  const col = await products();
  return col.find({ status: 'published' }).sort({ createdAt: -1 }).limit(limit).toArray();
}

export async function insertProduct(doc: Omit<Product, '_id'>): Promise<Product> {
  const col = await products();
  const result = await col.insertOne(doc as Product);
  return { ...doc, _id: result.insertedId } as Product;
}

export async function updateProduct(id: string, update: Partial<Omit<Product, '_id'>>): Promise<void> {
  const col = await products();
  await col.updateOne({ _id: new ObjectId(id) }, { $set: { ...update, updatedAt: new Date() } });
}

export async function listProductsForAdmin(params: {
  cursor?: string;
  pageSize?: number;
  status?: Product['status'];
}): Promise<{ items: Product[]; nextCursor: string | null }> {
  const col = await products();
  const pageSize = clampPageSize(params.pageSize);
  const filter: Filter<Product> = {};
  if (params.status) filter.status = params.status;

  const cursor = decodeCursor(params.cursor);
  const combinedFilter: Filter<Product> = cursor
    ? ({ $and: [filter, keysetFilter('createdAt', -1, cursor, true)] } as Filter<Product>)
    : filter;

  const docs = await col
    .find(combinedFilter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(pageSize + 1)
    .toArray();

  const hasMore = docs.length > pageSize;
  const page = hasMore ? docs.slice(0, pageSize) : docs;
  const last = page.at(-1);
  const nextCursor =
    hasMore && last ? encodeCursor({ value: last.createdAt.toISOString(), id: last._id.toString() }) : null;

  return { items: page, nextCursor };
}
