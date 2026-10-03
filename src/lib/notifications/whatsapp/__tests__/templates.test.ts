import { describe, it, expect } from 'vitest';
import { ObjectId } from 'mongodb';
import { buildTemplatePlan } from '../templates';
import type { Order, OrderLineItem } from '@/types/domain';
import { makeAddress } from '@/test/factory';

function makeOrder(itemCount: number): Order {
  const items: OrderLineItem[] = Array.from({ length: itemCount }, (_, i) => ({
    productId: new ObjectId(),
    productSlug: `product-${i}`,
    title: `Product ${i}`,
    sku: `SKU-${i}`,
    size: 'M',
    colorName: 'Black',
    unitPriceMinor: 100000,
    quantity: 1,
    lineTotalMinor: 100000,
    fulfillment: 'ready_stock',
  }));

  return {
    _id: new ObjectId(),
    orderNumber: 'VYB-20250101-ABCDEF',
    trackingToken: 'token',
    customerId: null,
    idempotencyKey: 'key',
    items,
    subtotalMinor: items.length * 100000,
    discountMinor: 0,
    shippingMinor: 25000,
    totalMinor: items.length * 100000 + 25000,
    shipping: makeAddress(),
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    fulfillmentStatus: 'pending',
    statusHistory: [],
    placedAt: new Date('2025-01-01T10:00:00Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('buildTemplatePlan', () => {
  it('uses the single-message template for a small order', () => {
    const plan = buildTemplatePlan(makeOrder(2), 'https://vybe.pk/admin/orders/x');
    expect(plan.templateName).toBe('vybe_new_order');
    expect(plan.documentText).toBeUndefined();
  });

  it('switches to the document template for an order with many line items', () => {
    const plan = buildTemplatePlan(makeOrder(12), 'https://vybe.pk/admin/orders/x');
    expect(plan.templateName).toBe('vybe_new_order_document');
    expect(plan.documentText).toBeTruthy();
    expect(plan.documentFilename).toContain('VYB-20250101-ABCDEF');
  });

  it('sanitizes dynamic parameters to a single line with no long runs of spaces', () => {
    const order = makeOrder(1);
    order.notes = 'Line one\nLine two   with lots of   spaces';
    const plan = buildTemplatePlan(order, 'https://vybe.pk/admin/orders/x');
    for (const param of plan.bodyParams) {
      expect(param).not.toMatch(/[\n\t\r]/);
      expect(param).not.toMatch(/ {2,}/);
    }
  });
});
