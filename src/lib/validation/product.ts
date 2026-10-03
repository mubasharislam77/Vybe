import { z } from 'zod';
import { objectIdSchema } from './common';

export const productImageSchema = z.object({
  url: z.url(),
  publicId: z.string().min(1),
  alt: z.string().trim().min(1).max(200),
  order: z.number().int().min(0),
});

export const variantInputSchema = z.object({
  sku: z.string().trim().min(1).max(60),
  size: z.string().trim().min(1).max(20),
  colorName: z.string().trim().min(1).max(40),
  colorSwatchHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color'),
  priceMinor: z.number().int().positive(),
  compareAtPriceMinor: z.number().int().positive().optional(),
  stock: z.number().int().min(0),
  images: z.array(productImageSchema).default([]),
});

export const productInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must be lowercase, hyphenated'),
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().min(10).max(5000),
  status: z.enum(['draft', 'published']),
  categoryIds: z.array(objectIdSchema).default([]),
  collectionIds: z.array(objectIdSchema).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).default([]),
  audience: z.enum(['men', 'women', 'unisex']),
  images: z.array(productImageSchema).min(1, 'At least one product image is required'),
  videoUrl: z.url().optional(),
  fabric: z.string().trim().max(300).optional(),
  fit: z.string().trim().max(300).optional(),
  careInstructions: z.string().trim().max(1000).optional(),
  sizeGuideId: objectIdSchema.optional(),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(160).optional(),
  featured: z.boolean().default(false),
  fulfillment: z.enum(['ready_stock', 'made_to_order']),
  productionLeadTimeDays: z.number().int().positive().max(180).optional(),
  variants: z.array(variantInputSchema).min(1, 'At least one variant is required'),
}).refine(
  (data) => data.fulfillment !== 'made_to_order' || data.productionLeadTimeDays !== undefined,
  { message: 'Production lead time is required for made-to-order products', path: ['productionLeadTimeDays'] },
).refine(
  (data) => new Set(data.variants.map((v) => v.sku)).size === data.variants.length,
  { message: 'Variant SKUs must be unique within a product', path: ['variants'] },
).refine(
  (data) => new Set(data.variants.map((v) => `${v.size}__${v.colorName}`)).size === data.variants.length,
  { message: 'Each size/color combination must be unique within a product', path: ['variants'] },
);

export type ProductInput = z.infer<typeof productInputSchema>;

export const SORT_OPTIONS = ['newest', 'price_asc', 'price_desc', 'best_selling', 'relevance'] as const;

/** Next.js gives a plain string for `?size=M` but an array for `?size=M&size=L` — normalize both to an array. */
const stringOrArray = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => (v === undefined ? undefined : (Array.isArray(v) ? v : [v]).map((s) => s.trim()).filter(Boolean)));

export const listingQuerySchema = z.object({
  category: z.string().trim().optional(),
  collection: z.string().trim().optional(),
  audience: z.enum(['men', 'women', 'unisex']).optional(),
  tag: z.string().trim().optional(),
  size: stringOrArray,
  color: stringOrArray,
  fit: z.string().trim().optional(),
  minPriceMinor: z.coerce.number().int().min(0).optional(),
  maxPriceMinor: z.coerce.number().int().min(0).optional(),
  availability: z.enum(['in_stock', 'made_to_order', 'all']).optional(),
  onSale: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(SORT_OPTIONS).optional(),
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().positive().max(48).optional(),
});

export type ListingQuery = z.infer<typeof listingQuerySchema>;
