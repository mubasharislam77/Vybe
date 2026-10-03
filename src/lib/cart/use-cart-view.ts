'use client';

import { useEffect, useState } from 'react';
import { useCart } from './cart-context';
import { getCartView } from '@/lib/actions/cart.actions';
import type { CartLineView } from '@/lib/services/cart.service';

/** Cart line items re-resolved against the live catalog (title/image/price/availability) — see cart.service.resolveCartView. */
export function useCartView(): { lines: CartLineView[]; isLoading: boolean } {
  const { items, isLoaded } = useCart();
  const [lines, setLines] = useState<CartLineView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (items.length === 0) {
      setLines([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    let cancelled = false;
    getCartView(items).then((result) => {
      if (!cancelled) {
        setLines(result);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // Re-fetch whenever the sku/quantity set changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, JSON.stringify(items)]);

  return { lines, isLoading };
}
