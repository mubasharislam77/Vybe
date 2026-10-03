import { ObjectId } from 'mongodb';
import { carts } from '@/lib/db/collections';
import type { CartItem } from '@/types/domain';

function mergeItems(a: CartItem[], b: CartItem[]): CartItem[] {
  const bySku = new Map<string, number>();
  for (const item of [...a, ...b]) {
    bySku.set(item.sku, (bySku.get(item.sku) ?? 0) + item.quantity);
  }
  return Array.from(bySku.entries()).map(([sku, quantity]) => ({ sku, quantity }));
}

export async function getCustomerCart(customerId: string): Promise<CartItem[]> {
  const col = await carts();
  const doc = await col.findOne({ customerId: new ObjectId(customerId) });
  return doc?.items ?? [];
}

export async function setCustomerCart(customerId: string, items: CartItem[]): Promise<void> {
  const col = await carts();
  await col.updateOne(
    { customerId: new ObjectId(customerId) },
    { $set: { items, updatedAt: new Date() } },
    { upsert: true },
  );
}

/** Called once on login: union the guest (local) cart into the customer's server cart. */
export async function mergeIntoCustomerCart(customerId: string, guestItems: CartItem[]): Promise<CartItem[]> {
  const existing = await getCustomerCart(customerId);
  const merged = mergeItems(existing, guestItems);
  await setCustomerCart(customerId, merged);
  return merged;
}
