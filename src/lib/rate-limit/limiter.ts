import { rateLimitBuckets } from '@/lib/db/collections';

/**
 * Shared, serverless-compatible fixed-window rate limiter backed by Mongo
 * (rather than pulling in Redis/Upstash solely for this). Each call atomically
 * upserts-and-increments a window bucket keyed by `key` + the current window
 * start; a TTL index (see db/indexes.ts) reaps expired buckets automatically.
 * Good enough for a single-store traffic volume; swap for Upstash Redis if
 * request volume ever makes per-call Mongo round-trips a bottleneck.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const col = await rateLimitBuckets();
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const bucketId = `${key}:${windowStart}`;

  const result = await col.findOneAndUpdate(
    { _id: bucketId },
    {
      $inc: { count: 1 },
      $setOnInsert: {
        windowStart: new Date(windowStart),
        expiresAt: new Date(windowStart + windowMs * 2),
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  const count = result?.count ?? 1;
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}

/** Best-effort client identity for rate limiting — real IP behind Vercel's proxy. */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip') ?? 'unknown';
}
