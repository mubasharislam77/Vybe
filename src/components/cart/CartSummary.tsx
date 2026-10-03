'use client';

import { formatPKR } from '@/lib/utils/money';
import { Button } from '@/components/ui/Button';

const TRUST_ITEMS = [
  { label: 'Cash on delivery', icon: '💵' },
  { label: 'Easy 7-day returns', icon: '↺' },
  { label: 'WhatsApp support', icon: '💬' },
];

export function CartSummary({
  subtotal,
  itemCount,
  hasUnavailable,
  onCheckout,
}: {
  subtotal: number;
  itemCount: number;
  hasUnavailable: boolean;
  onCheckout: () => void;
}) {
  return (
    <div className="sticky top-24 flex flex-col gap-6 border border-ink/10 bg-ivory p-6">
      <div>
        <h2 className="font-display text-sm uppercase tracking-widest2 text-ink">Order Summary</h2>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-ink-600">
            Subtotal <span className="text-ink-400">({itemCount} item{itemCount === 1 ? '' : 's'})</span>
          </span>
          <span className="font-medium text-ink">{formatPKR(subtotal)}</span>
        </div>
        <p className="mt-2 text-xs text-ink-400">Shipping and discounts calculated at checkout.</p>
      </div>

      {hasUnavailable && (
        <p className="bg-burgundy/10 px-3 py-2 text-xs text-burgundy" role="alert">
          Remove unavailable items before checking out.
        </p>
      )}

      <Button variant="primary" size="lg" className="w-full" disabled={hasUnavailable} onClick={onCheckout}>
        Checkout
      </Button>

      <ul className="flex flex-col gap-2.5 border-t border-ink/10 pt-5">
        {TRUST_ITEMS.map((item) => (
          <li key={item.label} className="flex items-center gap-2.5 text-xs text-ink-600">
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
