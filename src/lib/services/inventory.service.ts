import type { ClientSession } from 'mongodb';
import { products } from '@/lib/db/collections';

export interface StockClaim {
  sku: string;
  quantity: number;
}

/**
 * Atomically decrements stock for a ready-stock variant, conditioned on
 * `stock >= quantity` at write time — the standard "conditional update"
 * pattern that prevents overselling the last unit under concurrent
 * checkouts without a separate read-then-write race window. Made-to-order
 * variants (fulfillment stocked unbounded by lead time, not by `stock`)
 * are not decremented at all; the caller should skip calling this for them.
 *
 * Must run inside the same transaction session as the order insert, so a
 * failed claim rolls back the whole checkout.
 */
export async function claimStock(sku: string, quantity: number, session: ClientSession): Promise<boolean> {
  const col = await products();
  const result = await col.updateOne(
    { variants: { $elemMatch: { sku, stock: { $gte: quantity } } } },
    { $inc: { 'variants.$[elem].stock': -quantity } },
    { arrayFilters: [{ 'elem.sku': sku }], session },
  );
  return result.modifiedCount === 1;
}

export async function releaseStock(sku: string, quantity: number, session?: ClientSession): Promise<void> {
  const col = await products();
  await col.updateOne(
    { 'variants.sku': sku },
    { $inc: { 'variants.$[elem].stock': quantity } },
    { arrayFilters: [{ 'elem.sku': sku }], session },
  );
}

export async function incrementSalesCounts(
  items: { sku: string; quantity: number }[],
  session: ClientSession,
): Promise<void> {
  const col = await products();
  for (const item of items) {
    await col.updateOne(
      { 'variants.sku': item.sku },
      { $inc: { salesCount: item.quantity } },
      { session },
    );
  }
}
