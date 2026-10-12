import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { placeOrder } from '@/lib/services/checkout.service';
import { setFulfillmentStatus } from '@/lib/services/order.service';
import { allowedPaymentTransitions, setPaymentStatus, InvalidPaymentTransitionError } from '@/lib/services/payment.service';
import { createProductFromInput, updateProductFromInput, productToInput, ProductSaveError } from '@/lib/services/admin-product.service';
import { createStaff, updateStaff, StaffManagementError } from '@/lib/services/staff.service';
import { getOrderStats } from '@/lib/repositories/orders.repo';
import { getProductById } from '@/lib/repositories/products.repo';
import { attachBankTransferProof, findOrderById } from '@/lib/repositories/orders.repo';
import { updateStoreSettings, getStoreSettings } from '@/lib/repositories/settings.repo';
import { makeProduct, makeAddress } from '@/test/factory';
import type { CheckoutInput } from '@/lib/validation/checkout';
import type { ProductInput } from '@/lib/validation/product';

async function placeTestOrder(skuQty: { sku: string; quantity: number }[], paymentMethod: 'cod' | 'bank_transfer' = 'cod') {
  return placeOrder(
    { idempotencyKey: randomUUID(), items: skuQty, shipping: makeAddress(), paymentMethod } as CheckoutInput,
    null,
  );
}

function productInput(overrides: Partial<ProductInput> = {}): ProductInput {
  const n = randomUUID().slice(0, 8);
  return {
    slug: `admin-test-${n}`,
    title: `Admin Test ${n}`,
    description: 'Created by the admin service test suite.',
    status: 'draft',
    categoryIds: [],
    collectionIds: [],
    tags: ['Test', 'test'],
    audience: 'unisex',
    images: [{ url: 'https://example.com/a.jpg', publicId: 'a', alt: 'A', order: 5 }],
    featured: false,
    fulfillment: 'ready_stock',
    variants: [
      { sku: `ADM-${n}-M`, size: 'M', colorName: 'Black', colorSwatchHex: '#000000', priceMinor: 250000, stock: 4, images: [] },
    ],
    ...overrides,
  };
}

describe('admin-product.service', () => {
  it('creates a product, normalizes tags/images, and round-trips through productToInput', async () => {
    const created = await createProductFromInput(productInput({ videoUrl: undefined }));
    expect(created.tags).toEqual(['test']);
    expect(created.images[0].order).toBe(0);
    expect(created.salesCount).toBe(0);

    const asInput = productToInput(created);
    expect(asInput.videoUrl).toBeUndefined(); // not stored as null
    const stored = await getProductById(created._id.toString());
    expect(stored && 'videoUrl' in stored).toBe(false);
  });

  it('rejects a duplicate slug and a duplicate SKU with friendly errors', async () => {
    const first = await createProductFromInput(productInput());
    await expect(createProductFromInput(productInput({ slug: first.slug }))).rejects.toMatchObject({ code: 'duplicate_slug' });
    await expect(
      createProductFromInput(productInput({ variants: [{ ...first.variants[0], images: [] }] })),
    ).rejects.toBeInstanceOf(ProductSaveError);
  });

  it('update clears optional fields that were omitted and preserves variant images by SKU', async () => {
    const created = await createProductFromInput(
      productInput({
        fabric: 'Cotton',
        variants: [
          { sku: `ADM-${randomUUID().slice(0, 6)}`, size: 'L', colorName: 'Red', colorSwatchHex: '#ff0000', priceMinor: 100000, stock: 1, images: [{ url: 'https://example.com/v.jpg', publicId: 'v', alt: 'V', order: 0 }] },
        ],
      }),
    );
    const input = productToInput(created);
    input.fabric = undefined;
    input.variants[0].images = []; // form doesn't edit variant galleries
    const updated = await updateProductFromInput(created._id.toString(), input);
    expect(updated.fabric).toBeUndefined();
    expect(updated.variants[0].images).toHaveLength(1);
  });
});

describe('payment.service', () => {
  it('verifies an uploaded bank-transfer proof', async () => {
    const product = await makeProduct({ stock: 5 });
    const { order } = await placeTestOrder([{ sku: product.variants[0].sku, quantity: 1 }], 'bank_transfer');
    await attachBankTransferProof(order._id.toString(), { url: 'https://example.com/p.jpg', publicId: 'p' });
    const pending = await findOrderById(order._id.toString());
    expect(pending?.paymentStatus).toBe('awaiting_verification');
    expect(allowedPaymentTransitions(pending!)).toEqual(['verified', 'failed']);

    const verified = await setPaymentStatus(order._id.toString(), 'verified', 'admin@test');
    expect(verified.paymentStatus).toBe('verified');
    // refund only becomes available once the order is cancelled/returned
    expect(allowedPaymentTransitions(verified)).toEqual([]);
  });

  it('rejecting a bank transfer cancels a still-pending order and restores stock', async () => {
    const product = await makeProduct({ stock: 5 });
    const sku = product.variants[0].sku;
    const { order } = await placeTestOrder([{ sku, quantity: 2 }], 'bank_transfer');
    expect((await getProductById(product._id.toString()))?.variants[0].stock).toBe(3);

    const failed = await setPaymentStatus(order._id.toString(), 'failed', 'admin@test');
    expect(failed.paymentStatus).toBe('failed');
    expect(failed.fulfillmentStatus).toBe('cancelled');
    expect((await getProductById(product._id.toString()))?.variants[0].stock).toBe(5);
  });

  it('refuses an invalid payment transition', async () => {
    const product = await makeProduct({ stock: 5 });
    const { order } = await placeTestOrder([{ sku: product.variants[0].sku, quantity: 1 }]);
    await expect(setPaymentStatus(order._id.toString(), 'refunded', 'admin@test')).rejects.toBeInstanceOf(
      InvalidPaymentTransitionError,
    );
  });

  it('allows refund bookkeeping after a verified order is cancelled', async () => {
    const product = await makeProduct({ stock: 5 });
    const { order } = await placeTestOrder([{ sku: product.variants[0].sku, quantity: 1 }]);
    await setPaymentStatus(order._id.toString(), 'verified', 'admin@test');
    await setFulfillmentStatus(order._id.toString(), 'cancelled', 'admin@test');
    const cancelled = await findOrderById(order._id.toString());
    expect(allowedPaymentTransitions(cancelled!)).toEqual(['refund_pending']);
    await setPaymentStatus(order._id.toString(), 'refund_pending', 'admin@test');
    const refunded = await setPaymentStatus(order._id.toString(), 'refunded', 'admin@test');
    expect(refunded.paymentStatus).toBe('refunded');
  });
});

describe('staff.service lockout guards', () => {
  it('blocks demoting the last active admin, and blocks self-demotion even when another admin exists', async () => {
    const n = randomUUID().slice(0, 8);
    const admin = await createStaff({ fullName: 'Solo Admin', email: `solo-${n}@example.test`, role: 'admin', password: 'Password123' });
    await expect(
      updateStaff({ id: admin._id.toString(), fullName: admin.fullName, role: 'staff', active: true }, admin._id.toString()),
    ).rejects.toBeInstanceOf(StaffManagementError);

    const second = await createStaff({ fullName: 'Second Admin', email: `second-${n}@example.test`, role: 'admin', password: 'Password123' });
    // self-demotion is still refused…
    await expect(
      updateStaff({ id: admin._id.toString(), fullName: admin.fullName, role: 'staff', active: true }, admin._id.toString()),
    ).rejects.toBeInstanceOf(StaffManagementError);
    // …but another admin may do it
    const demoted = await updateStaff({ id: admin._id.toString(), fullName: admin.fullName, role: 'staff', active: true }, second._id.toString());
    expect(demoted.role).toBe('staff');

    await expect(createStaff({ fullName: 'Dup', email: second.email, role: 'staff', password: 'Password123' })).rejects.toBeInstanceOf(
      StaffManagementError,
    );
  });
});

describe('dashboard aggregates', () => {
  it('excludes cancelled orders from revenue and counts pending orders', async () => {
    const product = await makeProduct({ stock: 10, priceMinor: 100000 });
    const sku = product.variants[0].sku;
    const before = await getOrderStats();
    const { order: kept } = await placeTestOrder([{ sku, quantity: 1 }]);
    const { order: dropped } = await placeTestOrder([{ sku, quantity: 1 }]);
    await setFulfillmentStatus(dropped._id.toString(), 'cancelled', 'admin@test');

    const after = await getOrderStats();
    expect(after.revenue.last24h - before.revenue.last24h).toBe(kept.totalMinor);
    expect(after.orderCount.last24h - before.orderCount.last24h).toBe(1);
    expect(after.byFulfillment.cancelled - before.byFulfillment.cancelled).toBe(1);
  });
});

describe('settings update', () => {
  it('removes the free-shipping threshold when cleared instead of storing null', async () => {
    await updateStoreSettings({ freeShippingThresholdMinor: 500000 });
    expect((await getStoreSettings()).freeShippingThresholdMinor).toBe(500000);
    await updateStoreSettings({ freeShippingThresholdMinor: undefined });
    const cleared = await getStoreSettings();
    expect('freeShippingThresholdMinor' in cleared).toBe(false);
  });
});
