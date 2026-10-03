import { ObjectId, type ClientSession } from 'mongodb';
import { notificationOutbox } from '@/lib/db/collections';
import type { NotificationOutboxEntry, NotificationStatus } from '@/types/domain';

const MAX_ATTEMPTS = 6;
const WORKER_LOCK_MS = 60_000;

/** Written inside the same transaction as the order insert (transactional outbox pattern). */
export async function enqueueWhatsAppNotification(
  orderId: ObjectId,
  orderNumber: string,
  payloadSummary: string,
  session: ClientSession,
): Promise<void> {
  const col = await notificationOutbox();
  const now = new Date();
  const doc: Omit<NotificationOutboxEntry, '_id'> = {
    channel: 'whatsapp',
    orderId,
    orderNumber,
    status: 'pending',
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    nextAttemptAt: now,
    payloadSummary,
    createdAt: now,
    updatedAt: now,
  };
  await col.insertOne(doc as NotificationOutboxEntry, { session });
}

/**
 * Claims up to `limit` due entries for this worker run, using an atomic
 * findOneAndUpdate-per-entry lock (lockedAt/lockedBy) so two overlapping
 * worker invocations (e.g. a Vercel cron overlap) don't both send the same
 * message. The lock expires after WORKER_LOCK_MS in case a worker crashes
 * mid-send, so entries aren't stuck forever — this is also exactly why a
 * duplicate send is possible under ambiguous network failure (see README
 * "Known limitation: at-least-once delivery").
 */
export async function claimDueNotifications(workerId: string, limit = 10): Promise<NotificationOutboxEntry[]> {
  const col = await notificationOutbox();
  const now = new Date();
  const lockExpiry = new Date(now.getTime() - WORKER_LOCK_MS);
  const claimed: NotificationOutboxEntry[] = [];

  for (let i = 0; i < limit; i++) {
    const result = await col.findOneAndUpdate(
      {
        status: { $in: ['pending', 'failed'] },
        nextAttemptAt: { $lte: now },
        attempts: { $lt: MAX_ATTEMPTS },
        $or: [{ lockedAt: { $exists: false } }, { lockedAt: { $lte: lockExpiry } }],
      },
      { $set: { lockedAt: now, lockedBy: workerId } },
      { sort: { nextAttemptAt: 1 }, returnDocument: 'after' },
    );
    if (!result) break;
    claimed.push(result);
  }
  return claimed;
}

export async function markProviderAccepted(id: ObjectId, providerMessageId: string): Promise<void> {
  const col = await notificationOutbox();
  await col.updateOne(
    { _id: id },
    {
      $set: { status: 'provider_accepted', providerMessageId, updatedAt: new Date() },
      $unset: { lockedAt: '', lockedBy: '' },
      $inc: { attempts: 1 },
    },
  );
}

export async function markDelivered(providerMessageId: string): Promise<void> {
  const col = await notificationOutbox();
  await col.updateOne(
    { providerMessageId },
    { $set: { status: 'delivered', updatedAt: new Date() } },
  );
}

const BACKOFF_SCHEDULE_MS = [30_000, 120_000, 600_000, 1_800_000, 3_600_000];

export async function markFailed(id: ObjectId, error: string, attempts: number): Promise<void> {
  const col = await notificationOutbox();
  const permanentlyFailed = attempts + 1 >= MAX_ATTEMPTS;
  const backoff = BACKOFF_SCHEDULE_MS[Math.min(attempts, BACKOFF_SCHEDULE_MS.length - 1)];
  await col.updateOne(
    { _id: id },
    {
      $set: {
        status: permanentlyFailed ? 'failed' : 'pending',
        lastError: error,
        nextAttemptAt: new Date(Date.now() + backoff),
        updatedAt: new Date(),
      },
      $unset: { lockedAt: '', lockedBy: '' },
      $inc: { attempts: 1 },
    },
  );
}

export async function retryNow(id: ObjectId): Promise<void> {
  const col = await notificationOutbox();
  await col.updateOne(
    { _id: id },
    {
      $set: { status: 'pending', nextAttemptAt: new Date(), updatedAt: new Date() },
      $unset: { lockedAt: '', lockedBy: '' },
    },
  );
}

export async function listNotificationsForAdmin(filters: {
  status?: NotificationStatus;
  limit?: number;
}): Promise<NotificationOutboxEntry[]> {
  const col = await notificationOutbox();
  const filter = filters.status ? { status: filters.status } : {};
  return col.find(filter).sort({ createdAt: -1 }).limit(filters.limit ?? 100).toArray();
}
