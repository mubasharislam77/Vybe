import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { normalizePakistaniPhone } from '@/lib/utils/phone';
import { PAKISTANI_PROVINCES } from '@/lib/constants/provinces';

export const objectIdSchema = z.string().refine((v) => ObjectId.isValid(v), {
  message: 'Invalid id',
});

export const pakistaniPhoneSchema = z
  .string()
  .transform((v) => normalizePakistaniPhone(v))
  .refine((v): v is string => v !== null, { message: 'Enter a valid Pakistani mobile number' });

export { PAKISTANI_PROVINCES };

export const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phoneE164: pakistaniPhoneSchema,
  alternatePhoneE164: pakistaniPhoneSchema.optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  addressLine: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(80),
  province: z.enum(PAKISTANI_PROVINCES),
  postalCode: z.string().trim().max(10).optional(),
  landmark: z.string().trim().max(200).optional(),
});

/**
 * Image/banner locations: a full http(s) URL (Cloudinary, external) OR a
 * root-relative path under /public (the seed catalog and any hand-placed
 * assets use `/products/...`). Rejects protocol-relative `//` and anything
 * without a leading slash.
 */
export const imageLocationSchema = z
  .string()
  .trim()
  .min(1)
  .refine((v) => /^https?:\/\/\S+$/.test(v) || (/^\/[^/\s]/.test(v) && !/\s/.test(v)), {
    message: 'Must be a full URL (https://…) or a root-relative path (/images/…)',
  });

export const paginationQuerySchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().positive().max(48).optional(),
});
