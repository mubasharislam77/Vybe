import { z } from 'zod';
import { objectIdSchema } from './common';

export const categoryInputSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(80),
  parentId: objectIdSchema.nullable().default(null),
  order: z.number().int().default(0),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.url().optional(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const collectionInputSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
  bannerImageUrl: z.url().optional(),
  isActive: z.boolean().default(true),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});

export type CollectionInput = z.infer<typeof collectionInputSchema>;
