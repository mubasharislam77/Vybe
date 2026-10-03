import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { placeOrder } from '@/lib/services/checkout.service';
import { makeProduct, makeAddress } from '@/test/factory';
import { runEmailWorker } from '../worker';
import { notificationOutbox } from '@/lib/db/collections';
import type { CheckoutInput } from '@/lib/validation/checkout';

async function placeTestOrder() {
  const product = await makeProduct({ stock: 5 });
  return placeOrder(
    {
      idempotencyKey: randomUUID(),
      items: [{ sku: product.variants[0].sku, quantity: 1 }],
      shipping: makeAddress(),
      paymentMethod: 'cod',
    } as CheckoutInput,
    null,
  );
}

describe('Email outbox + worker', () => {
  it('enqueues a pending email notification transactionally with the order, alongside the whatsapp one', async () => {
    const { order } = await placeTestOrder();

    const col = await notificationOutbox();
    const emailEntry = await col.findOne({ orderId: order._id, channel: 'email' });
    const whatsappEntry = await col.findOne({ orderId: order._id, channel: 'whatsapp' });

    expect(emailEntry).toBeTruthy();
    expect(emailEntry?.status).toBe('pending');
    expect(whatsappEntry).toBeTruthy();
  });

  it('leaves the email notification pending (not failed) when Resend credentials are not configured', async () => {
    const { order } = await placeTestOrder();

    const summary = await runEmailWorker(50);
    expect(summary.skippedUnconfigured).toBeGreaterThanOrEqual(1);

    const col = await notificationOutbox();
    const entry = await col.findOne({ orderId: order._id, channel: 'email' });
    expect(entry?.status).toBe('pending');
    expect(entry?.attempts).toBe(0);
  });

  it('only claims email-channel entries, never touching whatsapp entries', async () => {
    const { order } = await placeTestOrder();

    await runEmailWorker(50);

    const col = await notificationOutbox();
    const whatsappEntry = await col.findOne({ orderId: order._id, channel: 'whatsapp' });
    // untouched: still pending, zero attempts, no lock left behind
    expect(whatsappEntry?.status).toBe('pending');
    expect(whatsappEntry?.attempts).toBe(0);
    expect(whatsappEntry?.lockedAt).toBeUndefined();
  });
});
