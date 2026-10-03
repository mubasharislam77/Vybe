import { runWhatsAppWorker } from './whatsapp/worker';
import { runEmailWorker } from './email/worker';

/**
 * Runs both notification-channel workers once. Shared by the cron route
 * (the durability backstop — catches anything that failed or wasn't
 * triggered) and the post-checkout trigger in checkout.actions.ts (fires
 * immediately after an order is placed, via next/server's `after()`, so
 * the admin gets notified within seconds in the common case instead of
 * waiting up to 5 minutes for the next cron tick).
 */
export async function drainNotificationOutbox(limit = 10) {
  const [whatsapp, email] = await Promise.all([runWhatsAppWorker(limit), runEmailWorker(limit)]);
  return { whatsapp, email };
}
