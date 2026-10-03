import { NextResponse } from 'next/server';
import { getWhatsAppConfig } from '@/lib/env';
import { verifyWebhookSignature } from '@/lib/notifications/whatsapp/client';
import { markDelivered, markFailed } from '@/lib/repositories/notifications.repo';
import { notificationOutbox } from '@/lib/db/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Meta's one-time webhook subscription verification handshake. */
export async function GET(request: Request) {
  const config = getWhatsAppConfig();
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (!config || mode !== 'subscribe' || token !== config.WHATSAPP_WEBHOOK_VERIFY_TOKEN || !challenge) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
  }
  return new NextResponse(challenge, { status: 200 });
}

interface StatusEntry {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  errors?: { message?: string }[];
}

/** Delivery-status callbacks for messages we sent — updates the outbox entry's terminal state. */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    entry?: { changes?: { value?: { statuses?: StatusEntry[] } }[] }[];
  };

  const statuses = payload.entry?.flatMap((e) => e.changes ?? []).flatMap((c) => c.value?.statuses ?? []) ?? [];

  for (const status of statuses) {
    if (status.status === 'delivered' || status.status === 'read') {
      await markDelivered(status.id);
    } else if (status.status === 'failed') {
      const col = await notificationOutbox();
      const entry = await col.findOne({ providerMessageId: status.id });
      if (entry) {
        await markFailed(entry._id, status.errors?.[0]?.message ?? 'Delivery failed', entry.attempts);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
