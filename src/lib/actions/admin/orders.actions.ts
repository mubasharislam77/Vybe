'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { objectIdSchema } from '@/lib/validation/common';
import { fulfillmentStatusSchema, paymentStatusSchema } from '@/lib/validation/admin';
import { setFulfillmentStatus } from '@/lib/services/order.service';
import { setPaymentStatus } from '@/lib/services/payment.service';
import { appendOrderStaffNote, findOrderById } from '@/lib/repositories/orders.repo';
import { listNotificationsForOrder, resetForManualRetry } from '@/lib/repositories/notifications.repo';
import { drainNotificationOutbox } from '@/lib/notifications/drain';
import { runAdminAction, audit, fail, ok, type AdminActionResult } from './_shared';

function revalidateOrder(orderId: string, orderNumber: string) {
  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/track-order/${orderNumber}`);
}

export async function updateOrderStatus(orderId: string, to: string): Promise<AdminActionResult> {
  return runAdminAction('staff', async (actor) => {
    const id = objectIdSchema.safeParse(orderId);
    const status = fulfillmentStatusSchema.safeParse(to);
    if (!id.success || !status.success) return fail('Invalid request.');

    const before = await findOrderById(id.data);
    if (!before) return fail('Order not found.');

    const by = actor.email ?? actor.name;
    const updated = await setFulfillmentStatus(id.data, status.data, by);
    await audit(actor, 'order.fulfillment_status', 'order', id.data, {
      orderNumber: updated.orderNumber,
      from: before.fulfillmentStatus,
      to: updated.fulfillmentStatus,
    });
    revalidateOrder(id.data, updated.orderNumber);
    return ok();
  });
}

export async function updateOrderPayment(orderId: string, to: string): Promise<AdminActionResult> {
  return runAdminAction('staff', async (actor) => {
    const id = objectIdSchema.safeParse(orderId);
    const status = paymentStatusSchema.safeParse(to);
    if (!id.success || !status.success) return fail('Invalid request.');

    const before = await findOrderById(id.data);
    if (!before) return fail('Order not found.');

    const updated = await setPaymentStatus(id.data, status.data, actor.email ?? actor.name);
    await audit(actor, 'order.payment_status', 'order', id.data, {
      orderNumber: updated.orderNumber,
      from: before.paymentStatus,
      to: updated.paymentStatus,
      fulfillmentStatus: updated.fulfillmentStatus,
    });
    revalidateOrder(id.data, updated.orderNumber);
    return ok();
  });
}

const noteSchema = z.object({ orderId: objectIdSchema, note: z.string().trim().min(1).max(1000) });

export async function addOrderNote(rawInput: unknown): Promise<AdminActionResult> {
  return runAdminAction('staff', async (actor) => {
    const parsed = noteSchema.safeParse(rawInput);
    if (!parsed.success) return fail('Write a note first (max 1000 characters).');
    const order = await findOrderById(parsed.data.orderId);
    if (!order) return fail('Order not found.');
    await appendOrderStaffNote(parsed.data.orderId, parsed.data.note, actor.email ?? actor.name);
    await audit(actor, 'order.note_added', 'order', parsed.data.orderId, { orderNumber: order.orderNumber });
    revalidateOrder(parsed.data.orderId, order.orderNumber);
    return ok();
  });
}

/** Re-queues both channel entries for this order and drains immediately. */
export async function resendOrderNotifications(orderId: string): Promise<AdminActionResult<{ sent: number; failed: number }>> {
  return runAdminAction('staff', async (actor) => {
    const id = objectIdSchema.safeParse(orderId);
    if (!id.success) return fail('Invalid request.');
    const order = await findOrderById(id.data);
    if (!order) return fail('Order not found.');

    const entries = await listNotificationsForOrder(order._id);
    for (const entry of entries) await resetForManualRetry(entry._id);
    const result = await drainNotificationOutbox(entries.length || 2);
    await audit(actor, 'order.notifications_resent', 'order', id.data, { orderNumber: order.orderNumber });
    revalidateOrder(id.data, order.orderNumber);
    revalidatePath('/admin/notifications');
    return ok({
      sent: result.email.sent + result.whatsapp.sent,
      failed: result.email.failed + result.whatsapp.failed,
    });
  });
}
