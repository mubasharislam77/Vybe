'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import { resolveCartView, type CartLineView } from '@/lib/services/cart.service';
import { mergeIntoCustomerCart, setCustomerCart, getCustomerCart } from '@/lib/repositories/cart.repo';
import type { CartItem } from '@/types/domain';

const cartItemsSchema = z
  .array(z.object({ sku: z.string().min(1), quantity: z.number().int().positive().max(20) }))
  .max(50);

export async function getCartView(items: CartItem[]): Promise<CartLineView[]> {
  const parsed = cartItemsSchema.parse(items);
  return resolveCartView(parsed);
}

/** Called once right after a successful customer login to union the local (guest) cart into their server cart. */
export async function mergeCartOnLogin(guestItems: CartItem[]): Promise<CartItem[]> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'customer') return guestItems;
  const parsed = cartItemsSchema.parse(guestItems);
  return mergeIntoCustomerCart(session.user.id, parsed);
}

export async function persistCustomerCart(items: CartItem[]): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'customer') return;
  const parsed = cartItemsSchema.parse(items);
  await setCustomerCart(session.user.id, parsed);
}

export async function loadCustomerCart(): Promise<CartItem[] | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'customer') return null;
  return getCustomerCart(session.user.id);
}
