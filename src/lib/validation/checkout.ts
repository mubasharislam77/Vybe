import { z } from 'zod';
import { addressSchema } from './common';

export const checkoutItemSchema = z.object({
  sku: z.string().trim().min(1),
  quantity: z.number().int().positive().max(20),
});

export const checkoutInputSchema = z.object({
  idempotencyKey: z.string().trim().min(10).max(100),
  items: z.array(checkoutItemSchema).min(1).max(50),
  shipping: addressSchema,
  email: z.email().optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  notes: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(['cod', 'bank_transfer']),
  couponCode: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

export const bankTransferProofSchema = z.object({
  orderNumber: z.string().trim().min(1),
  trackingToken: z.string().trim().min(1),
  proofUrl: z.url(),
  proofPublicId: z.string().trim().min(1),
});
