import './_env';
import { createInterface } from 'node:readline/promises';
import { MongoClient } from 'mongodb';
import { hashPassword } from '../src/lib/auth/password';
import { passwordSchema } from '../src/lib/validation/auth';
import { z } from 'zod';

/**
 * One-time creation of the first admin account. Run with:
 *   npm run provision:admin
 * or non-interactively:
 *   npm run provision:admin -- --name="Jane Doe" --email=jane@vybe.pk --password=...
 *
 * Refuses to run if a staff user already exists (use the admin panel's
 * staff management to add more admins/staff from there instead) — this
 * keeps the script from ever being usable to quietly add a second admin
 * in production without an audit trail.
 */
function parseFlags(argv: string[]) {
  const flags: Record<string, string> = {};
  for (const arg of argv) {
    const match = /^--([a-z]+)=(.*)$/.exec(arg);
    if (match) flags[match[1]] = match[2];
  }
  return flags;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  const dbName = process.env.MONGODB_DB_NAME ?? 'vybe';

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db(dbName);
    const staffUsers = db.collection('staff_users');

    const existing = await staffUsers.countDocuments();
    if (existing > 0) {
      console.error(
        `Refusing to run: ${existing} staff account(s) already exist. Use the admin panel's staff management to add more.`,
      );
      process.exitCode = 1;
      return;
    }

    const flags = parseFlags(process.argv.slice(2));
    let fullName = flags.name;
    let email = flags.email?.toLowerCase();
    let password = flags.password;

    if (!fullName || !email || !password) {
      console.log('--- VybeTheBrand: provision first admin account ---');
      console.log('(Password will be visible in your terminal as you type.)\n');
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      fullName ??= (await rl.question('Full name: ')).trim();
      email ??= (await rl.question('Email: ')).trim().toLowerCase();
      password ??= await rl.question('Password (min 8 chars, 1 letter, 1 number): ');
      rl.close();
    }

    const emailCheck = z.email().safeParse(email);
    if (!emailCheck.success) throw new Error('Invalid email');
    const passwordCheck = passwordSchema.safeParse(password);
    if (!passwordCheck.success) {
      throw new Error(passwordCheck.error.issues.map((i) => i.message).join(', '));
    }
    if (!fullName || fullName.length < 2) throw new Error('Full name is required');

    const passwordHash = await hashPassword(password);
    const now = new Date();
    await staffUsers.insertOne({
      email,
      passwordHash,
      fullName,
      role: 'admin',
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`\nAdmin account created for ${email}. Sign in at /admin/login.`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
