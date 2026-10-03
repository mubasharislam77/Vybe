'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { CartItem } from '@/types/domain';
import { persistCustomerCart, loadCustomerCart } from '@/lib/actions/cart.actions';

const STORAGE_KEY = 'vybe_cart_v1';

interface CartContextValue {
  items: CartItem[];
  totalQuantity: number;
  isLoaded: boolean;
  addItem: (sku: string, quantity: number) => void;
  removeItem: (sku: string) => void;
  setQuantity: (sku: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readLocalCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CartItem => typeof i?.sku === 'string' && typeof i?.quantity === 'number' && i.quantity > 0,
    );
  } catch {
    return [];
  }
}

function writeLocalCart(items: CartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore (private browsing / storage disabled) — cart just won't persist across reloads
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasMergedForSession = useRef(false);

  // Initial load: local cart first (instant), then reconcile with the
  // server cart once we know the auth status.
  useEffect(() => {
    setItems(readLocalCart());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || hasMergedForSession.current) return;
    hasMergedForSession.current = true;
    loadCustomerCart().then((serverItems) => {
      if (serverItems === null) return;
      const local = readLocalCart();
      const merged = mergeItems(serverItems, local);
      setItems(merged);
      writeLocalCart(merged);
      void persistCustomerCart(merged);
    });
  }, [status]);

  useEffect(() => {
    if (!isLoaded) return;
    writeLocalCart(items);
    if (status === 'authenticated') {
      void persistCustomerCart(items);
    }
  }, [items, isLoaded, status]);

  const value = useMemo<CartContextValue>(() => {
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
    return {
      items,
      totalQuantity,
      isLoaded,
      addItem: (sku, quantity) =>
        setItems((prev) => mergeItems(prev, [{ sku, quantity }])),
      removeItem: (sku) => setItems((prev) => prev.filter((i) => i.sku !== sku)),
      setQuantity: (sku, quantity) =>
        setItems((prev) =>
          quantity <= 0 ? prev.filter((i) => i.sku !== sku) : prev.map((i) => (i.sku === sku ? { ...i, quantity } : i)),
        ),
      clear: () => setItems([]),
    };
  }, [items, isLoaded]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function mergeItems(a: CartItem[], b: CartItem[]): CartItem[] {
  const bySku = new Map<string, number>();
  for (const item of [...a, ...b]) {
    bySku.set(item.sku, (bySku.get(item.sku) ?? 0) + item.quantity);
  }
  return Array.from(bySku.entries()).map(([sku, quantity]) => ({ sku, quantity }));
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
