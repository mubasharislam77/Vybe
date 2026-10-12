import { ObjectId } from 'mongodb';
import type { Product, Variant } from '@/types/domain';
import type { ProductInput } from '@/lib/validation/product';
import { getProductById, insertProduct, updateProduct } from '@/lib/repositories/products.repo';

export class ProductSaveError extends Error {
  constructor(public code: 'duplicate_slug' | 'duplicate_sku' | 'not_found', message: string) {
    super(message);
  }
}

function isDuplicateKeyError(err: unknown): err is { code: number; message: string; keyPattern?: Record<string, unknown> } {
  return Boolean(err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000);
}

function translateDuplicate(err: unknown): never {
  if (isDuplicateKeyError(err)) {
    const key = err.keyPattern ? Object.keys(err.keyPattern)[0] : '';
    if (key === 'variants.sku' || err.message.includes('variants.sku')) {
      throw new ProductSaveError('duplicate_sku', 'One of the variant SKUs is already used by another product.');
    }
    throw new ProductSaveError('duplicate_slug', 'A product with this slug already exists.');
  }
  throw err;
}

function toVariant(input: ProductInput['variants'][number], existing?: Variant): Variant {
  return {
    sku: input.sku,
    size: input.size,
    colorName: input.colorName,
    colorSwatchHex: input.colorSwatchHex,
    priceMinor: input.priceMinor,
    compareAtPriceMinor: input.compareAtPriceMinor,
    stock: input.stock,
    // The admin form only edits product-level images; keep any per-variant
    // gallery a variant already had (matched by SKU) rather than wiping it.
    images: input.images.length > 0 ? input.images : (existing?.images ?? []),
  };
}

function mapInput(input: ProductInput, existing?: Product): Omit<Product, '_id' | 'createdAt' | 'updatedAt' | 'salesCount'> {
  const existingBySku = new Map((existing?.variants ?? []).map((v) => [v.sku, v]));
  return {
    slug: input.slug,
    title: input.title,
    description: input.description,
    status: input.status,
    categoryIds: input.categoryIds.map((id) => new ObjectId(id)),
    collectionIds: input.collectionIds.map((id) => new ObjectId(id)),
    tags: Array.from(new Set(input.tags.map((t) => t.toLowerCase()))),
    audience: input.audience,
    images: [...input.images].sort((a, b) => a.order - b.order).map((img, i) => ({ ...img, order: i })),
    videoUrl: input.videoUrl,
    fabric: input.fabric,
    fit: input.fit,
    careInstructions: input.careInstructions,
    sizeGuideId: input.sizeGuideId ? new ObjectId(input.sizeGuideId) : undefined,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    featured: input.featured,
    fulfillment: input.fulfillment,
    productionLeadTimeDays: input.fulfillment === 'made_to_order' ? input.productionLeadTimeDays : undefined,
    variants: input.variants.map((v) => toVariant(v, existingBySku.get(v.sku))),
  };
}

export async function createProductFromInput(input: ProductInput): Promise<Product> {
  const now = new Date();
  try {
    return await insertProduct({ ...mapInput(input), salesCount: 0, createdAt: now, updatedAt: now });
  } catch (err) {
    translateDuplicate(err);
  }
}

/**
 * Full replace of the editable fields. Note on stock: the form submits
 * absolute stock numbers per variant, which overwrite whatever checkout
 * decremented since the page was loaded — an admin editing stock while
 * orders are flowing should re-check the number after saving. Counters
 * the admin never edits (salesCount, createdAt) are untouched.
 */
export async function updateProductFromInput(id: string, input: ProductInput): Promise<Product> {
  const existing = await getProductById(id);
  if (!existing) throw new ProductSaveError('not_found', 'Product not found.');
  try {
    await updateProduct(id, mapInput(input, existing));
  } catch (err) {
    translateDuplicate(err);
  }
  const updated = await getProductById(id);
  if (!updated) throw new ProductSaveError('not_found', 'Product not found.');
  return updated;
}

/** Converts a stored product back into the shape the admin form edits (ids as strings). */
export function productToInput(product: Product): ProductInput {
  return {
    slug: product.slug,
    title: product.title,
    description: product.description,
    status: product.status,
    categoryIds: product.categoryIds.map((id) => id.toString()),
    collectionIds: product.collectionIds.map((id) => id.toString()),
    tags: product.tags,
    audience: product.audience,
    images: product.images,
    videoUrl: product.videoUrl,
    fabric: product.fabric,
    fit: product.fit,
    careInstructions: product.careInstructions,
    sizeGuideId: product.sizeGuideId?.toString(),
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    featured: product.featured,
    fulfillment: product.fulfillment,
    productionLeadTimeDays: product.productionLeadTimeDays,
    variants: product.variants.map((v) => ({
      sku: v.sku,
      size: v.size,
      colorName: v.colorName,
      colorSwatchHex: v.colorSwatchHex,
      priceMinor: v.priceMinor,
      compareAtPriceMinor: v.compareAtPriceMinor,
      stock: v.stock,
      images: v.images,
    })),
  };
}
