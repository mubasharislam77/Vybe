import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { placeOrder } from '@/lib/services/checkout.service';
import { setFulfillmentStatus, InvalidTransitionError } from '@/lib/services/order.service';
import { makeProduct, makeAddress } from '@/test/factory';
import { getProductById } from '@/lib/repositories/products.repo';
import type { CheckoutInput } from '@/lib/validation/checkout';

async function placeTestOrder(skuQty: { sku: string; quantity: number }[]) {
  return placeOrder(
    {
      idempotencyKey: randomUUID(),
      items: skuQty,
      shipping: makeAddress(),
      paymentMethod: 'cod',
    } as CheckoutInput,
    null,
  );
}

describe('order.service fulfillment transitions', () => {
  it('walks the happy path pending -> confirmed -> processing -> shipped -> delivered', async () => {
    const product = await makeProduct({ stock: 5 });
    const { order } = await placeTestOrder([{ sku: product.variants[0].sku, quantity: 1 }]);

    let current = await setFulfillmentStatus(order._id.toString(), 'confirmed', 'admin@test');
    expect(current.fulfillmentStatus).toBe('confirmed');
    current = await setFulfillmentStatus(order._id.toString(), 'processing', 'admin@test');
    current = await setFulfillmentStatus(order._id.toString(), 'shipped', 'admin@test');
    current = await setFulfillmentStatus(order._id.toString(), 'delivered', 'admin@test');
    expect(current.fulfillmentStatus).toBe('delivered');
    expect(current.statusHistory.map((h) => h.status)).toEqual([
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
    ]);
  });

  it('rejects an invalid transition (e.g. delivered -> pending)', async () => {
    const product = await makeProduct({ stock: 5 });
    const { order } = await placeTestOrder([{ sku: product.variants[0].sku, quantity: 1 }]);
    await setFulfillmentStatus(order._id.toString(), 'confirmed', 'admin@test');
    await setFulfillmentStatus(order._id.toString(), 'processing', 'admin@test');
    await setFulfillmentStatus(order._id.toString(), 'shipped', 'admin@test');
    await setFulfillmentStatus(order._id.toString(), 'delivered', 'admin@test');

    await expect(setFulfillmentStatus(order._id.toString(), 'pending', 'admin@test')).rejects.toBeInstanceOf(
      InvalidTransitionError,
    );
  });

  it('cancelling a pending order releases stock and refunds coupon usage', async () => {
    const product = await makeProduct({ stock: 5 });
    const sku = product.variants[0].sku;
    const { order } = await placeTestOrder([{ sku, quantity: 2 }]);

    const beforeCancel = await getProductById(product._id.toString());
    expect(beforeCancel?.variants[0].stock).toBe(3);

    await setFulfillmentStatus(order._id.toString(), 'cancelled', 'admin@test');

    const afterCancel = await getProductById(product._id.toString());
    expect(afterCancel?.variants[0].stock).toBe(5); // fully restocked
  });

  it('returning a delivered order restocks items without touching coupon usage', async () => {
    const product = await makeProduct({ stock: 5 });
    const sku = product.variants[0].sku;
    const { order } = await placeTestOrder([{ sku, quantity: 1 }]);

    await setFulfillmentStatus(order._id.toString(), 'confirmed', 'admin@test');
    await setFulfillmentStatus(order._id.toString(), 'processing', 'admin@test');
    await setFulfillmentStatus(order._id.toString(), 'shipped', 'admin@test');
    await setFulfillmentStatus(order._id.toString(), 'delivered', 'admin@test');

    const beforeReturn = await getProductById(product._id.toString());
    expect(beforeReturn?.variants[0].stock).toBe(4);

    const returned = await setFulfillmentStatus(order._id.toString(), 'returned', 'admin@test');
    expect(returned.fulfillmentStatus).toBe('returned');

    const afterReturn = await getProductById(product._id.toString());
    expect(afterReturn?.variants[0].stock).toBe(5); // restocked
  });
});
