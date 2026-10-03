import { z } from 'zod';

export const couponInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,20}$/, 'Use 3-20 letters, numbers, - or _'),
    type: z.enum(['percent', 'fixed']),
    value: z.number().positive(),
    minSpendMinor: z.number().int().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    perCustomerLimit: z.number().int().positive().optional(),
    startsAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional(),
    active: z.boolean().default(true),
  })
  .refine((d) => d.type !== 'percent' || d.value <= 100, {
    message: 'Percent discount cannot exceed 100',
    path: ['value'],
  });

export type CouponInput = z.infer<typeof couponInputSchema>;
