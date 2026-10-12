import './_env';
import { MongoClient } from 'mongodb';
import { z } from 'zod';
import { hashPassword } from '../src/lib/auth/password';
import { passwordSchema } from '../src/lib/validation/auth';

/**
 * Create or update a staff/admin account directly in the database —
 * for environments where you can't yet sign in to the portal (first
 * admin on production, or a locked-out team). Idempotent: re-running
 * with the same email updates name/role/password and re-activates it.
 *
 *   npm run staff:add -- --email=you@vybe.pk --name="Your Name" --password=... [--role=admin|staff]
 *
 * Point it at production by setting MONGODB_URI (and MONGODB_DB_NAME)
 * for that one command, e.g.
 *   MONGODB_URI='mongodb+srv://…' MONGODB_DB_NAME=vybe npm run staff:add -- --email=… --name=… --password=…
 *
 * Unlike provision-admin.ts this does not refuse when staff already exist,
 * so every run is printed loudly; prefer the portal's Staff accounts page
 * (which audit-logs changes) once you can sign in.
 */
function parseFlags(argv: string[]) {
  const flags: Record<string, string> = {};
  for (const arg of argv) {
    const match = /^--([a-z]+)=(.*)$/.exec(arg);
    if (match) flags[match[1]] = match[2];
  }
  return flags;
}

const flagsSchema = z.object({
  email: z.email().transform((v) => v.toLowerCase()),
  name: z.string().trim().min(2).max(100),
  password: passwordSchema,
  role: z.enum(['admin', 'staff']).default('admin'),
});

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  const dbName = process.env.MONGODB_DB_NAME ?? 'vybe';

  const parsed = flagsSchema.safeParse(parseFlags(process.argv.slice(2)));
  if (!parsed.success) {
    throw new Error(
      'Usage: npm run staff:add -- --email=… --name="…" --password=… [--role=admin|staff]\n' +
        parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n'),
    );
  }
  const { email, name, password, role } = parsed.data;

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db(dbName);
    const host = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, 'http://')).host;
    const now = new Date();
    const result = await db.collection('staff_users').updateOne(
      { email },
      {
        $set: { fullName: name, role, active: true, passwordHash: await hashPassword(password), updatedAt: now },
        $setOnInsert: { email, createdAt: now },
      },
      { upsert: true },
    );
    console.log(
      `${result.upsertedCount ? 'Created' : 'Updated'} ${role} account ${email} in database "${dbName}" on ${host}. Sign in at /admin/login.`,
    );
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
