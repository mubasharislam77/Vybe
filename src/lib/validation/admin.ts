import { z } from 'zod';
import { passwordSchema } from './auth';
import { objectIdSchema } from './common';
import { isValidE164 } from '@/lib/utils/phone';

export const staffRoleSchema = z.enum(['admin', 'staff']);

export const staffCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.email().transform((v) => v.toLowerCase()),
  role: staffRoleSchema,
  password: passwordSchema,
});
export type StaffCreateInput = z.infer<typeof staffCreateSchema>;

export const staffUpdateSchema = z.object({
  id: objectIdSchema,
  fullName: z.string().trim().min(2).max(100),
  role: staffRoleSchema,
  active: z.boolean(),
});
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;

export const staffPasswordResetSchema = z.object({
  id: objectIdSchema,
  password: passwordSchema,
});

export const changeOwnPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

const optionalE164 = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .transform((v) => (v ? v : ''))
  .refine((v) => v === '' || isValidE164(v), { message: 'Use international format, e.g. +923001234567' });

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .transform((v) => (v ? v : undefined))
  .refine((v) => v === undefined || /^https?:\/\//.test(v), { message: 'Must be a full URL starting with http(s)://' });

export const shippingZoneSchema = z.object({
  name: z.string().trim().min(1).max(60),
  cities: z
    .array(z.string().trim().min(1).max(60))
    .min(1, 'Add at least one city'),
  feeMinor: z.number().int().min(0),
  codEligible: z.boolean(),
});

export const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(1).max(80),
  contactPhoneE164: optionalE164,
  contactEmail: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : ''))
    .refine((v) => v === '' || z.email().safeParse(v).success, { message: 'Enter a valid email' }),
  whatsappSupportNumberE164: optionalE164,
  socialLinks: z
    .array(z.object({ platform: z.string().trim().min(1).max(30), url: z.string().trim().url() }))
    .max(10)
    .default([]),
  shippingZones: z.array(shippingZoneSchema).max(50).default([]),
  defaultShippingFeeMinor: z.number().int().min(0),
  freeShippingThresholdMinor: z.number().int().positive().optional(),
  bankTransferInstructions: z.string().trim().max(2000).optional(),
});
export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;

export const fulfillmentStatusSchema = z.enum([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
]);

export const paymentStatusSchema = z.enum([
  'pending',
  'awaiting_verification',
  'verified',
  'failed',
  'refund_pending',
  'refunded',
]);

export const reviewModerationSchema = z.object({
  id: objectIdSchema,
  status: z.enum(['approved', 'rejected']),
});

export const adminSearchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  cursor: z.string().optional(),
});

export { optionalUrl };
