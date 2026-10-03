import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';

/**
 * Stateless, signed, short-lived token for the one WhatsApp Cloud API
 * use case that needs an unauthenticated fetchable URL: Meta's servers
 * fetching the "detailed order summary" document for large orders (see
 * templates.ts). Security rests entirely on this being a 256-bit-signed,
 * time-limited, never-linked-anywhere token — not on login — so treat it
 * like a bearer credential: never log the full token, never surface it in
 * any UI other than the one outgoing WhatsApp message.
 */
const DEFAULT_TTL_SECONDS = 24 * 60 * 60; // matches Meta's media re-fetch retry window

export function signDocumentToken(orderNumber: string, ttlSeconds = DEFAULT_TTL_SECONDS): string {
  const expires = Date.now() + ttlSeconds * 1000;
  const payload = `${orderNumber}.${expires}`;
  const signature = createHmac('sha256', env.AUTH_SECRET).update(payload).digest('base64url');
  return `${expires}.${signature}`;
}

export function verifyDocumentToken(orderNumber: string, token: string): boolean {
  const [expiresStr, signature] = token.split('.');
  if (!expiresStr || !signature) return false;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  const payload = `${orderNumber}.${expires}`;
  const expected = createHmac('sha256', env.AUTH_SECRET).update(payload).digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
