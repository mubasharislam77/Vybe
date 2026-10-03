'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart/cart-context';
import { useCartView } from '@/lib/cart/use-cart-view';
import { formatPKR } from '@/lib/utils/money';
import { Button, LinkButton } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export function CartPageClient() {
  const router = useRouter();
  const { setQuantity, removeItem, isLoaded } = useCart();
  const { lines, isLoading } = useCartView();

  if (!isLoaded || isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="font-display text-xl uppercase tracking-widest2 text-ink">Your cart is empty</p>
        <LinkButton href="/shop" variant="primary" size="md">
          Start Shopping
        </LinkButton>
      </div>
    );
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotalMinor, 0);
  const hasUnavailable = lines.some((l) => !l.available);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
      <ul className="flex flex-col divide-y divide-ink/10">
        {lines.map((line) => (
          <li key={line.sku} className="flex gap-4 py-6">
            <div className="relative h-28 w-24 shrink-0 overflow-hidden bg-ink/5">
              {line.imageUrl && <Image src={line.imageUrl} alt={line.title} fill sizes="96px" className="object-cover" />}
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div>
                {line.slug ? (
                  <Link href={`/products/${line.slug}`} className="text-sm font-medium text-ink hover:underline">
                    {line.title}
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-burgundy">{line.title}</p>
                )}
                <p className="text-xs text-ink-400">
                  {line.size} / {line.colorName}
                </p>
                {!line.available && (
                  <p className="mt-1 text-xs text-burgundy" role="alert">
                    {line.productStatus === 'not_found'
                      ? 'No longer available'
                      : `Only limited stock left${line.availableStock !== null ? ` (${line.availableStock})` : ''}`}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex h-9 items-stretch border border-ink/20 text-sm">
                  <button
                    type="button"
                    aria-label={`Decrease quantity of ${line.title}`}
                    onClick={() => setQuantity(line.sku, line.quantity - 1)}
                    className="w-9"
                  >
                    −
                  </button>
                  <span className="flex w-9 items-center justify-center" aria-live="polite">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase quantity of ${line.title}`}
                    onClick={() => setQuantity(line.sku, line.quantity + 1)}
                    className="w-9"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-ink">{formatPKR(line.lineTotalMinor)}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label={`Remove ${line.title} from cart`}
              onClick={() => removeItem(line.sku)}
              className="h-11 w-11 shrink-0 self-start text-xl text-ink-400 hover:text-burgundy"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <div className="h-fit border border-ink/10 p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-600">Subtotal</span>
          <span className="text-ink">{formatPKR(subtotal)}</span>
        </div>
        <p className="mt-2 text-xs text-ink-400">Shipping and discounts calculated at checkout.</p>
        {hasUnavailable && (
          <p className="mt-3 text-xs text-burgundy" role="alert">
            Remove unavailable items before checking out.
          </p>
        )}
        <Button
          variant="primary"
          size="lg"
          className="mt-6 w-full"
          disabled={hasUnavailable}
          onClick={() => router.push('/checkout')}
        >
          Checkout
        </Button>
      </div>
    </div>
  );
}
