import { randomUUID } from 'node:crypto';
import { env, getEmailConfig } from '@/lib/env';
import { claimDueNotifications, markProviderAccepted, markFailed, retryNow } from '@/lib/repositories/notifications.repo';
import { findOrderById } from '@/lib/repositories/orders.repo';
import { buildOrderEmail } from './templates';
import { sendOrderEmail, EmailNotConfiguredError } from './client';

export interface EmailWorkerRunSummary {
  claimed: number;
  sent: number;
  failed: number;
  skippedUnconfigured: number;
}

/** Same outbox/claim/backoff machinery as the WhatsApp worker, just a different channel and sender. */
export async function runEmailWorker(limit = 10): Promise<EmailWorkerRunSummary> {
  const workerId = randomUUID();
  const entries = await claimDueNotifications('email', workerId, limit);
  const summary: EmailWorkerRunSummary = { claimed: entries.length, sent: 0, failed: 0, skippedUnconfigured: 0 };

  for (const entry of entries) {
    const order = await findOrderById(entry.orderId.toString());
    if (!order) {
      await markFailed(entry._id, 'Order no longer exists', entry.attempts);
      summary.failed += 1;
      continue;
    }

    const adminOrderUrl = `${env.NEXT_PUBLIC_SITE_URL}/admin/orders/${order._id.toString()}`;
    const email = buildOrderEmail(order, adminOrderUrl);

    try {
      if (!getEmailConfig()) throw new EmailNotConfiguredError();
      const { id } = await sendOrderEmail(email);
      await markProviderAccepted(entry._id, id);
      summary.sent += 1;
    } catch (err) {
      if (err instanceof EmailNotConfiguredError) {
        await retryNow(entry._id);
        summary.skippedUnconfigured += 1;
        continue;
      }
      const message = err instanceof Error ? err.message : 'Unknown error';
      await markFailed(entry._id, message, entry.attempts);
      summary.failed += 1;
    }
  }

  return summary;
}
