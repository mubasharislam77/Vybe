import { NextResponse } from 'next/server';
import { verifyDocumentToken } from '@/lib/notifications/whatsapp/document-token';
import { buildOrderNotificationSummary } from '@/lib/notifications/whatsapp/templates';
import { findOrderByOrderNumber } from '@/lib/repositories/orders.repo';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/rate-limit/limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Fetched directly by Meta's servers (as a WhatsApp template document
 * header) — not by a logged-in admin, so it can't require a session
 * cookie. Protected instead by a signed, short-lived, single-order token
 * (see document-token.ts). Never linked from anywhere else in the app.
 */
export async function GET(request: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  const { allowed } = await checkRateLimit(`whatsapp-doc:${clientIpFromHeaders(request.headers)}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  if (!token || !verifyDocumentToken(orderNumber, token)) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 });
  }

  const order = await findOrderByOrderNumber(orderNumber);
  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const text = buildOrderNotificationSummary(order);
  return new NextResponse(text, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="order-${orderNumber}.txt"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
