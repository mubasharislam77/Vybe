'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart/cart-context';
import { useCartView } from '@/lib/cart/use-cart-view';
import { Skeleton } from '@/components/ui/Skeleton';
import { CartLineItem } from './CartLineItem';
import { CartSummary } from './CartSummary';
import { EmptyCart } from './EmptyCart';
import { RevealOnScroll } from '@/components/ui/ScrollReveal';
import { ProductCard, type ProductCardData } from '@/components/ui/ProductCard';

export function CartPageClient({ crossSell }: { crossSell: ProductCardData[] }) {
  const router = useRouter();
  const { setQuantity, removeItem, isLoaded } = useCart();
  const { lines, isLoading } = useCartView();

  const loading = !isLoaded || isLoading;
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotalMinor, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const hasUnavailable = lines.some((l) => !l.available);

  return (
    <div className="flex flex-col gap-16">
      <div>
        <RevealOnScroll y={12}>
          <h1 className="font-display text-4xl uppercase tracking-tight text-ink sm:text-5xl">Your Cart</h1>
          {!loading && lines.length > 0 && (
            <p className="mt-2 text-sm text-ink-400">
              {itemCount} item{itemCount === 1 ? '' : 's'} in your cart
            </p>
          )}
        </RevealOnScroll>

        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
              <div className="flex flex-col gap-4">
                {[0, 1].map((i) => (
                  <Skeleton key={i} className="h-36 w-full" />
                ))}
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          ) : lines.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
              <ul className="flex flex-col gap-4">
                {lines.map((line) => (
                  <CartLineItem
                    key={line.sku}
                    line={line}
                    onSetQuantity={(q) => setQuantity(line.sku, q)}
                    onRemove={() => removeItem(line.sku)}
                  />
                ))}
              </ul>

              <CartSummary
                subtotal={subtotal}
                itemCount={itemCount}
                hasUnavailable={hasUnavailable}
                onCheckout={() => router.push('/checkout')}
              />
            </div>
          )}
        </div>
      </div>

      {!loading && crossSell.length > 0 && (
        <div className="border-t border-ink/10 pt-4">
          <h2 className="mb-8 font-display text-2xl uppercase tracking-widest2 text-ink sm:text-3xl">
            {lines.length === 0 ? 'Shop the Drop' : 'You Might Also Like'}
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4">
            {crossSell.slice(0, 4).map((p) => (
              <RevealOnScroll key={p.slug} y={24} scale={0.96}>
                <ProductCard product={p} />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
