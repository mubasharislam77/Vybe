'use server';

import { revalidatePath } from 'next/cache';
import { objectIdSchema } from '@/lib/validation/common';
import { findNotificationById, resetForManualRetry } from '@/lib/repositories/notifications.repo';
import { drainNotificationOutbox } from '@/lib/notifications/drain';
import { runAdminAction, audit, fail, ok, type AdminActionResult } from './_shared';

export interface WorkerRunResult {
  email: { claimed: number; sent: number; failed: number; skippedUnconfigured: number };
  whatsapp: { claimed: number; sent: number; failed: number; skippedUnconfigured: number };
}

export async function retryNotification(notificationId: string): Promise<AdminActionResult<WorkerRunResult>> {
  return runAdminAction('staff', async (actor) => {
    const idCheck = objectIdSchema.safeParse(notificationId);
    if (!idCheck.success) return fail('Invalid request.');
    const entry = await findNotificationById(idCheck.data);
    if (!entry) return fail('Notification not found.');
    await resetForManualRetry(entry._id);
    const result = await drainNotificationOutbox(1);
    await audit(actor, 'notification.retried', 'notification', idCheck.data, {
      channel: entry.channel,
      orderNumber: entry.orderNumber,
    });
    revalidatePath('/admin/notifications');
    revalidatePath(`/admin/orders/${entry.orderId.toString()}`);
    return ok(result);
  });
}

/** Same as the cron endpoint, but triggered by a signed-in staff member. */
export async function runNotificationWorkerNow(): Promise<AdminActionResult<WorkerRunResult>> {
  return runAdminAction('staff', async (actor) => {
    const result = await drainNotificationOutbox(20);
    await audit(actor, 'notification.worker_run', 'notification', 'all', {
      email: result.email,
      whatsapp: result.whatsapp,
    });
    revalidatePath('/admin/notifications');
    revalidatePath('/admin');
    return ok(result);
  });
}
