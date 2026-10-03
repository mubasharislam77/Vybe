import { randomUUID } from 'node:crypto';
import { env, getWhatsAppConfig } from '@/lib/env';
import {
  claimDueNotifications,
  markProviderAccepted,
  markFailed,
  retryNow,
} from '@/lib/repositories/notifications.repo';
import { findOrderById } from '@/lib/repositories/orders.repo';
import { buildTemplatePlan } from './templates';
import { sendOrderTemplate, WhatsAppNotConfiguredError } from './client';
import { signDocumentToken } from './document-token';

export interface WorkerRunSummary {
  claimed: number;
  sent: number;
  failed: number;
  skippedUnconfigured: number;
}

/**
 * Processes due entries from the transactional outbox. Each entry is
 * claimed with a worker-id lock (see notifications.repo) so overlapping
 * invocations don't double-send — though under an ambiguous network
 * failure between our send and Meta's ack, an at-least-once duplicate is
 * still possible; see README "Known limitation".
 */
export async function runWhatsAppWorker(limit = 10): Promise<WorkerRunSummary> {
  const workerId = randomUUID();
  const entries = await claimDueNotifications('whatsapp', workerId, limit);
  const summary: WorkerRunSummary = { claimed: entries.length, sent: 0, failed: 0, skippedUnconfigured: 0 };

  for (const entry of entries) {
    const order = await findOrderById(entry.orderId.toString());
    if (!order) {
      await markFailed(entry._id, 'Order no longer exists', entry.attempts);
      summary.failed += 1;
      continue;
    }

    const adminOrderUrl = `${env.NEXT_PUBLIC_SITE_URL}/admin/orders/${order._id.toString()}`;
    const plan = buildTemplatePlan(order, adminOrderUrl);

    const documentUrl =
      plan.templateName === 'vybe_new_order_document'
        ? `${env.NEXT_PUBLIC_SITE_URL}/api/whatsapp/documents/${order.orderNumber}?token=${encodeURIComponent(
            signDocumentToken(order.orderNumber),
          )}`
        : undefined;

    try {
      if (!getWhatsAppConfig()) throw new WhatsAppNotConfiguredError();
      const { providerMessageId } = await sendOrderTemplate(plan, documentUrl);
      await markProviderAccepted(entry._id, providerMessageId);
      summary.sent += 1;
    } catch (err) {
      if (err instanceof WhatsAppNotConfiguredError) {
        // Not a failure to count against attempts — release the lock and
        // leave it pending so it's picked up automatically once an admin
        // adds credentials, visible in /admin/notifications meanwhile.
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
