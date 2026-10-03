import { z } from 'zod';

/**
 * Core env vars required for the app to boot at all (DB + session security).
 * Validated eagerly — fail fast at startup rather than deep inside a request.
 */
const coreSchema = z.object({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB_NAME: z.string().min(1).default('vybe'),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
});

export const env = coreSchema.parse({
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

/**
 * Optional integration groups. These are NOT validated eagerly — a missing
 * Cloudinary or WhatsApp credential must not crash the whole app, since the
 * storefront and checkout work without them. Each getter returns `null` when
 * incomplete; callers (admin health panel, upload routes, notification
 * worker) are responsible for surfacing that as a configuration state.
 */

const cloudinarySchema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

export function getCloudinaryConfig() {
  const parsed = cloudinarySchema.safeParse({
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  });
  return parsed.success ? parsed.data : null;
}

const whatsappSchema = z.object({
  WHATSAPP_CLOUD_API_TOKEN: z.string().min(1),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().min(1),
  WHATSAPP_ADMIN_NOTIFICATION_NUMBER: z.string().min(1),
  WHATSAPP_APP_SECRET: z.string().min(1),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().min(1),
});

export function getWhatsAppConfig() {
  const parsed = whatsappSchema.safeParse({
    WHATSAPP_CLOUD_API_TOKEN: process.env.WHATSAPP_CLOUD_API_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    WHATSAPP_ADMIN_NOTIFICATION_NUMBER: process.env.WHATSAPP_ADMIN_NOTIFICATION_NUMBER,
    WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET,
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
  });
  return parsed.success ? parsed.data : null;
}

const emailSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  ADMIN_NOTIFICATION_EMAIL: z.email(),
});

export function getEmailConfig() {
  const parsed = emailSchema.safeParse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    ADMIN_NOTIFICATION_EMAIL: process.env.ADMIN_NOTIFICATION_EMAIL,
  });
  return parsed.success ? parsed.data : null;
}

export function getCronSecret(): string | null {
  const v = process.env.CRON_SECRET;
  return v && v.length >= 16 ? v : null;
}
