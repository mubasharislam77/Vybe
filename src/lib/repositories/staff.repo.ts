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
