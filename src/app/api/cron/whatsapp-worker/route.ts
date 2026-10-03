import { NextResponse } from 'next/server';
import { getCronSecret } from '@/lib/env';
import { runWhatsAppWorker } from '@/lib/notifications/whatsapp/worker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Triggered by Vercel Cron (vercel.json) as a backstop sweep, and/or by
 * Upstash QStash for near-real-time delivery — see README "WhatsApp setup"
 * for why Vercel Hobby's daily-only cron isn't fast enough on its own.
 *
 * Protected by a shared secret rather than session auth, since the caller
 * is a scheduler, not a logged-in user. When a `CRON_SECRET` env var is
 * set, Vercel automatically sends it as `Authorization: Bearer <secret>`
 * on its own cron requests, so nothing needs to be embedded in
 * vercel.json; configure QStash (or any other scheduler) to send the same
 * header.
 */
export async function POST(request: Request) {
  const secret = getCronSecret();
  const authHeader = request.headers.get('authorization');
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const provided = bearer ?? new URL(request.url).searchParams.get('secret');
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const summary = await runWhatsAppWorker();
  return NextResponse.json(summary);
}

export async function GET(request: Request) {
  return POST(request);
}
