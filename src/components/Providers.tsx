'use client';

import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/lib/cart/cart-context';
import { WishlistProvider } from '@/lib/wishlist/wishlist-context';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <WishlistProvider>{children}</WishlistProvider>
      </CartProvider>
    </SessionProvider>
  );
}
