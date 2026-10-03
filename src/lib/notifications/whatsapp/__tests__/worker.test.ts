import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { placeOrder } from '@/lib/services/checkout.service';
import { makeProduct, makeAddress } from '@/test/factory';
import { runWhatsAppWorker } from '../worker';
import { notificationOutbox } from '@/lib/db/collections';
import { verifyWebhookSignature } from '../client';

describe('WhatsApp outbox + worker', () => {
  it('enqueues a pending notification transactionally with the order', async () => {
    const product = await makeProduct({ stock: 5 });
    const { order } = await placeOrder(
      {
        idempotencyKey: randomUUID(),
        items: [{ sku: product.variants[0].sku, quantity: 1 }],
        shipping: makeAddress(),
        paymentMethod: 'cod',
      } as never,
      null,
    );

    const col = await notificationOutbox();
    const entry = await col.findOne({ orderId: order._id, channel: 'whatsapp' });
    expect(entry).toBeTruthy();
    expect(entry?.status).toBe('pending');
    expect(entry?.channel).toBe('whatsapp');
  });

  it('leaves the notification pending (not failed) when WhatsApp credentials are not configured', async () => {
    const product = await makeProduct({ stock: 5 });
    const { order } = await placeOrder(
      {
        idempotencyKey: randomUUID(),
        items: [{ sku: product.variants[0].sku, quantity: 1 }],
        shipping: makeAddress(),
        paymentMethod: 'cod',
      } as never,
      null,
    );

    const summary = await runWhatsAppWorker(50);
    expect(summary.skippedUnconfigured).toBeGreaterThanOrEqual(1);

    const col = await notificationOutbox();
    const entry = await col.findOne({ orderId: order._id, channel: 'whatsapp' });
    expect(entry?.status).toBe('pending');
    expect(entry?.attempts).toBe(0);
  });

  it('webhook signature verification fails closed when WhatsApp is not configured, and never throws', () => {
    expect(verifyWebhookSignature('{}', 'sha256=anything')).toBe(false);
    expect(verifyWebhookSignature('{}', null)).toBe(false);
  });
});
