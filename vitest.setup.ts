import { config } from 'dotenv';

config({ path: '.env.local' });
config();

// Tests must never share a database with manual dev/seed data. Set before
// any of our own modules are imported (dynamic import, since static
// imports are hoisted above this assignment and src/lib/env.ts reads
// process.env at module-load time).
process.env.MONGODB_DB_NAME = 'vybe_test';

// Tests must never hit real third-party APIs (sending actual emails/
// WhatsApp messages, spamming a real inbox/phone, depending on network
// access) regardless of what's in .env.local for manual dev use — the
// "leaves pending when unconfigured" tests specifically rely on these
// being absent so they exercise that code path deterministically.
delete process.env.RESEND_API_KEY;
delete process.env.ADMIN_NOTIFICATION_EMAIL;
delete process.env.WHATSAPP_CLOUD_API_TOKEN;
delete process.env.WHATSAPP_PHONE_NUMBER_ID;
delete process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
delete process.env.WHATSAPP_APP_SECRET;
delete process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

const { getMongoClient } = await import('@/lib/db/client');
const { createAllIndexes } = await import('@/lib/db/indexes');
const { env } = await import('@/lib/env');

const client = await getMongoClient();
await client.db(env.MONGODB_DB_NAME).dropDatabase();
await createAllIndexes(client.db(env.MONGODB_DB_NAME));
