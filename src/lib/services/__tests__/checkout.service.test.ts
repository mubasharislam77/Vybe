import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { placeOrder, CheckoutError } from '@/lib/services/checkout.service';
import { makeProduct, makeAddress } from '@/test/factory';
import { getProductById } from '@/lib/repositories/products.repo';
import type { CheckoutInput } from '@/lib/validation/checkout';

function baseInput(overrides: Partial<CheckoutInput> = {}): CheckoutInput {
  return {
    idempotencyKey: randomUUID(),
    items: [],
    shipping: makeAddress(),
    paymentMethod: 'cod',
    ...overrides,
  };
}

describe('checkout.service.placeOrder', () => {
  it('computes server-authoritative totals from the current variant price, ignoring any client-sent price', async () => {
    const product = await makeProduct({ priceMinor: 300000, stock: 5 });
    const sku = product.variants[0].sku;

    const { order } = await placeOrder(
      baseInput({ items: [{ sku, quantity: 2 }] }),
      null,
    );

    expect(order.items[0].unitPriceMinor).toBe(300000);
    expect(order.subtotalMinor).toBe(600000);
    expect(order.totalMinor).toBe(order.subtotalMinor + order.shippingMinor - order.discountMinor);

    const updated = await getProductById(product._id.toString());
    expect(updated?.variants[0].stock).toBe(3);
    expect(updated?.salesCount).toBe(2);
  });

  it('is idempotent: replaying the same idempotency key returns the original order without double-decrementing stock', async () => {
    const product = await makeProduct({ stock: 5 });
    const sku = product.variants[0].sku;
    const input = baseInput({ items: [{ sku, quantity: 1 }] });

    const first = await placeOrder(input, null);
    const second = await placeOrder(input, null);

    expect(second.replayed).toBe(true);
    expect(second.order._id.toString()).toBe(first.order._id.toString());

    const updated = await getProductById(product._id.toString());
    expect(updated?.variants[0].stock).toBe(4); // decremented only once
  });

  it('rejects an order for a quantity exceeding available stock, and does not partially decrement', async () => {
    const product = await makeProduct({ stock: 2 });
    const sku = product.variants[0].sku;

    await expect(
      placeOrder(baseInput({ items: [{ sku, quantity: 3 }] }), null),
    ).rejects.toBeInstanceOf(CheckoutError);

    const updated = await getProductById(product._id.toString());
    expect(updated?.variants[0].stock).toBe(2); // unchanged — transaction rolled back
  });

  it('under concurrent checkout for the last unit of stock, exactly one request succeeds', async () => {
    const product = await makeProduct({ stock: 1 });
    const sku = product.variants[0].sku;

    const results = await Promise.allSettled([
      placeOrder(baseInput({ items: [{ sku, quantity: 1 }] }), null),
      placeOrder(baseInput({ items: [{ sku, quantity: 1 }] }), null),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    if (rejected[0].status === 'rejected') {
      expect(rejected[0].reason).toBeInstanceOf(CheckoutError);
    }

    const updated = await getProductById(product._id.toString());
    expect(updated?.variants[0].stock).toBe(0);
  });

  it('does not cap made-to-order items to the stock field', async () => {
    const product = await makeProduct({ fulfillment: 'made_to_order', productionLeadTimeDays: 14, stock: 0 });
    const sku = product.variants[0].sku;

    const { order } = await placeOrder(baseInput({ items: [{ sku, quantity: 10 }] }), null);

    expect(order.items[0].quantity).toBe(10);
    expect(order.items[0].productionLeadTimeDays).toBe(14);

    const updated = await getProductById(product._id.toString());
    expect(updated?.variants[0].stock).toBe(0); // untouched, not decremented
  });
});
