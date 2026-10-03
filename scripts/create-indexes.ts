import './_env';
import { MongoClient } from 'mongodb';
import { createAllIndexes } from '../src/lib/db/indexes';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  const dbName = process.env.MONGODB_DB_NAME ?? 'vybe';

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db(dbName);
    await createAllIndexes(db);
    console.log(`Indexes created on database "${dbName}".`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
