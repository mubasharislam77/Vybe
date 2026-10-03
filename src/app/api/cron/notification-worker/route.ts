import { NextResponse } from 'next/server';
import { getCronSecret } from '@/lib/env';
import { drainNotificationOutbox } from '@/lib/notifications/drain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Triggered by Vercel Cron (vercel.json, once daily on the Hobby plan) —
 * this is now purely an optional safety net, not something you need to
 * set up or think about. The primary delivery path is a plain `await` of
 * drainNotificationOutbox() directly inside checkout.actions.submitCheckout,
 * in the same request as checkout — no background trickery. Since that
 * send is best-effort (a transient failure there doesn't undo the order
 * or fail the checkout), this route exists only to retry whatever that
 * attempt missed, whenever the cron happens to fire. Drains both outbox
 * channels in one tick; whichever channel isn't configured just reports
 * skippedUnconfigured and leaves its entries pending rather than failing.
 *
 * Protected by a shared secret rather than session auth, since the caller
 * is a scheduler, not a logged-in user. When a `CRON_SECRET` env var is
 * set, Vercel automatically sends it as `Authorization: Bearer <secret>`
 * on its own cron requests, so nothing needs to be embedded in
 * vercel.json; configure QStash (or any other scheduler) to send the same
 * header if you ever want tighter backstop timing than once a day.
 */
export async function POST(request: Request) {
  const secret = getCronSecret();
  const authHeader = request.headers.get('authorization');
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const provided = bearer ?? new URL(request.url).searchParams.get('secret');
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await drainNotificationOutbox();
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return POST(request);
}
