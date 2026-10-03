import { MongoClient, type Db } from 'mongodb';
import { env } from '@/lib/env';

/**
 * Module-level cached client/connection, reused across invocations on the
 * same warm serverless instance. In dev, Next.js hot-reload would otherwise
 * create a new client (and pool) per edit, so we also stash it on `global`.
 */
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const MAX_POOL_SIZE = Number(process.env.MONGODB_MAX_POOL_SIZE ?? 10);

function createClient(): Promise<MongoClient> {
  const client = new MongoClient(env.MONGODB_URI, {
    maxPoolSize: MAX_POOL_SIZE,
    minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE ?? 0),
    maxIdleTimeMS: 30_000,
    serverSelectionTimeoutMS: 10_000,
  });
  return client.connect();
}

function getClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === 'production') {
    if (!globalThis._mongoClientPromise) {
      globalThis._mongoClientPromise = createClient();
    }
    return globalThis._mongoClientPromise;
  }
  // Dev: persist across HMR reloads via globalThis, same pattern.
  if (!globalThis._mongoClientPromise) {
    globalThis._mongoClientPromise = createClient();
  }
  return globalThis._mongoClientPromise;
}

export async function getMongoClient(): Promise<MongoClient> {
  return getClientPromise();
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(env.MONGODB_DB_NAME);
}
