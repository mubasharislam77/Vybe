import { randomBytes } from 'node:crypto';

/** Human-readable, sequential-looking but not customer-identifying. Shown to the customer and in admin/WhatsApp. */
export function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `VYB-${y}${m}${d}-${rand}`;
}

/**
 * High-entropy (256-bit), unguessable token for the private order-tracking
 * link. Deliberately unrelated to `orderNumber` — knowing one must not help
 * guess the other.
 */
export function generateTrackingToken(): string {
  return randomBytes(32).toString('base64url');
}
