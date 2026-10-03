import { describe, it, expect } from 'vitest';
import { ObjectId } from 'mongodb';
import { buildOrderEmail } from '../templates';
import type { Order, OrderLineItem } from '@/types/domain';
import { makeAddress } from '@/test/factory';

function makeOrder(overrides: Partial<Order> = {}): Order {
  const items: OrderLineItem[] = [
    {
      productId: new ObjectId(),
      productSlug: 'product-0',
      title: 'Test Hoodie',
      sku: 'SKU-0',
      size: 'M',
      colorName: 'Black',
      unitPriceMinor: 300000,
      quantity: 1,
      lineTotalMinor: 300000,
      fulfillment: 'ready_stock',
    },
  ];

  return {
    _id: new ObjectId(),
    orderNumber: 'VYB-20250101-ABCDEF',
    trackingToken: 'token',
    customerId: null,
    idempotencyKey: 'key',
    items,
    subtotalMinor: 300000,
    discountMinor: 0,
    shippingMinor: 25000,
    totalMinor: 325000,
    shipping: makeAddress(),
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    fulfillmentStatus: 'pending',
    statusHistory: [],
    placedAt: new Date('2025-01-01T10:00:00Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('buildOrderEmail', () => {
  it('produces a subject, html, and text body containing the order total', () => {
    const email = buildOrderEmail(makeOrder(), 'https://vybe.pk/admin/orders/x');
    expect(email.subject).toContain('VYB-20250101-ABCDEF');
    expect(email.html).toContain('VYB-20250101-ABCDEF');
    expect(email.text).toContain('VYB-20250101-ABCDEF');
    expect(email.html).toContain('Test Hoodie');
  });

  it('escapes HTML in user-controlled fields (customer name, notes) to prevent injection', () => {
    const order = makeOrder({
      notes: '<img src=x onerror=alert(1)>',
      shipping: makeAddress({ fullName: '<script>alert(1)</script>' }),
    });
    const email = buildOrderEmail(order, 'https://vybe.pk/admin/orders/x');
    expect(email.html).not.toContain('<script>');
    expect(email.html).not.toContain('<img src=x onerror=');
    expect(email.html).toContain('&lt;script&gt;');
  });
});
