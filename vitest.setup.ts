import { config } from 'dotenv';

config({ path: '.env.local' });
config();

// Tests must never share a database with manual dev/seed data. Set before
// any of our own modules are imported (dynamic import, since static
// imports are hoisted above this assignment and src/lib/env.ts reads
// process.env at module-load time).
process.env.MONGODB_DB_NAME = 'vybe_test';

const { getMongoClient } = await import('@/lib/db/client');
const { createAllIndexes } = await import('@/lib/db/indexes');
const { env } = await import('@/lib/env');

const client = await getMongoClient();
await client.db(env.MONGODB_DB_NAME).dropDatabase();
await createAllIndexes(client.db(env.MONGODB_DB_NAME));
