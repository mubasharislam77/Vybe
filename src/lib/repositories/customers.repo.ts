import { ObjectId } from 'mongodb';
import { customers } from '@/lib/db/collections';
import type { Address, Customer } from '@/types/domain';
import { clampPageSize, decodeCursor, encodeCursor, keysetFilter } from '@/lib/utils/pagination';

export async function findCustomerByIdentifier(identifier: string): Promise<Customer | null> {
  const col = await customers();
  return col.findOne({ $or: [{ email: identifier.toLowerCase() }, { phoneE164: identifier }] });
}

export async function findCustomerById(id: string): Promise<Customer | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await customers();
  return col.findOne({ _id: new ObjectId(id) });
}

export async function createCustomer(input: {
  fullName: string;
  phoneE164: string;
  email?: string;
  passwordHash: string;
}): Promise<Customer> {
  const col = await customers();
  const now = new Date();
  const doc: Omit<Customer, '_id'> = {
    fullName: input.fullName,
    phoneE164: input.phoneE164,
    email: input.email?.toLowerCase(),
    passwordHash: input.passwordHash,
    role: 'customer',
    addresses: [],
    createdAt: now,
    updatedAt: now,
  };
  const result = await col.insertOne(doc as Customer);
  return { ...doc, _id: result.insertedId } as Customer;
}

export async function addCustomerAddress(customerId: string, address: Address): Promise<void> {
  const col = await customers();
  await col.updateOne(
    { _id: new ObjectId(customerId) },
    { $push: { addresses: address }, $set: { updatedAt: new Date() } },
  );
}

export async function listCustomerAddresses(customerId: string): Promise<Address[]> {
  const customer = await findCustomerById(customerId);
  return customer?.addresses ?? [];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listCustomersForAdmin(params: {
  q?: string;
  cursor?: string;
  pageSize?: number;
}): Promise<{ items: Customer[]; nextCursor: string | null }> {
  const col = await customers();
  const pageSize = clampPageSize(params.pageSize);
  const base: Record<string, unknown> = {};
  if (params.q) {
    const rx = { $regex: escapeRegex(params.q), $options: 'i' };
    base.$or = [{ fullName: rx }, { email: rx }, { phoneE164: rx }];
  }
  const cursor = decodeCursor(params.cursor);
  const filter = cursor ? { $and: [base, keysetFilter('createdAt', -1, cursor, true)] } : base;

  const docs = await col
    .find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(pageSize + 1)
    .toArray();
  const hasMore = docs.length > pageSize;
  const page = hasMore ? docs.slice(0, pageSize) : docs;
  const last = page.at(-1);
  const nextCursor =
    hasMore && last ? encodeCursor({ value: last.createdAt.toISOString(), id: last._id.toString() }) : null;
  return { items: page, nextCursor };
}

export async function countCustomers(): Promise<number> {
  const col = await customers();
  return col.countDocuments({});
}
