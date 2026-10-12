import { ObjectId } from 'mongodb';
import { staffUsers } from '@/lib/db/collections';
import type { StaffUser } from '@/types/domain';

export async function findStaffByEmail(email: string): Promise<StaffUser | null> {
  const col = await staffUsers();
  return col.findOne({ email: email.toLowerCase(), active: true });
}

export async function findStaffById(id: string): Promise<StaffUser | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await staffUsers();
  return col.findOne({ _id: new ObjectId(id) });
}

export async function createStaffUser(input: {
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'admin' | 'staff';
}): Promise<StaffUser> {
  const col = await staffUsers();
  const now = new Date();
  const doc: Omit<StaffUser, '_id'> = {
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    fullName: input.fullName,
    role: input.role,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  const result = await col.insertOne(doc as StaffUser);
  return { ...doc, _id: result.insertedId } as StaffUser;
}

export async function countStaffUsers(): Promise<number> {
  const col = await staffUsers();
  return col.countDocuments();
}

/** Unlike findStaffByEmail (login path), this also returns deactivated accounts — for uniqueness checks. */
export async function findStaffByEmailAnyStatus(email: string): Promise<StaffUser | null> {
  const col = await staffUsers();
  return col.findOne({ email: email.toLowerCase() });
}

export async function listStaffUsers(): Promise<StaffUser[]> {
  const col = await staffUsers();
  return col.find({}).sort({ createdAt: 1 }).toArray();
}

export async function updateStaffUser(
  id: string,
  update: { fullName: string; role: 'admin' | 'staff'; active: boolean },
): Promise<void> {
  const col = await staffUsers();
  await col.updateOne({ _id: new ObjectId(id) }, { $set: { ...update, updatedAt: new Date() } });
}

export async function updateStaffPassword(id: string, passwordHash: string): Promise<void> {
  const col = await staffUsers();
  await col.updateOne({ _id: new ObjectId(id) }, { $set: { passwordHash, updatedAt: new Date() } });
}

export async function countActiveAdmins(excludingId?: string): Promise<number> {
  const col = await staffUsers();
  const filter: Record<string, unknown> = { role: 'admin', active: true };
  if (excludingId) filter._id = { $ne: new ObjectId(excludingId) };
  return col.countDocuments(filter);
}
