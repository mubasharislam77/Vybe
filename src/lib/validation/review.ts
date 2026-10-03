import { z } from 'zod';
import { objectIdSchema } from './common';

export const reviewInputSchema = z.object({
  productId: objectIdSchema,
  customerName: z.string().trim().min(2).max(60),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(100).optional(),
  body: z.string().trim().min(10).max(2000),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;
