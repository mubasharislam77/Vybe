import { FALLBACK_PRODUCTS, type Product } from './products';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** Fetch catalog from the Nest API; fall back to local data if it's not running. */
export async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/products`, {
      // revalidate every 60s in prod
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as Product[];
    return Array.isArray(data) && data.length ? data : FALLBACK_PRODUCTS;
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

export type SubscribeResult = { ok: boolean; message: string };

export async function subscribe(email: string): Promise<SubscribeResult> {
  const res = await fetch(`${API_URL}/newsletter/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    message: data?.message ?? (res.ok ? 'You’re on the list.' : 'Something went wrong.'),
  };
}
