'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart/cart-context';
import { useCartView } from '@/lib/cart/use-cart-view';
import { submitCheckout } from '@/lib/actions/checkout.actions';
import { previewCheckoutTotals, type CheckoutPreview } from '@/lib/actions/checkout-preview.actions';
import { PAKISTANI_PROVINCES } from '@/lib/constants/provinces';
import { TextField, SelectField, TextAreaField } from '@/components/ui/FormField';
import { Button, LinkButton } from '@/components/ui/Button';
import { formatPKR } from '@/lib/utils/money';

export function CheckoutForm() {
  const router = useRouter();
  const { items, clear } = useCart();
  const { lines, isLoading: linesLoading } = useCartView();

  const idempotencyKey = useRef(crypto.randomUUID());
  const [city, setCity] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer'>('cod');
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    const handle = setTimeout(() => {
      previewCheckoutTotals({ items, city: city || undefined, couponCode: couponCode || undefined }).then(setPreview);
    }, 350);
    return () => clearTimeout(handle);
  }, [items, city, couponCode]);

  useEffect(() => {
    if (preview && !preview.codEligible && paymentMethod === 'cod') {
      setPaymentMethod('bank_transfer');
    }
  }, [preview, paymentMethod]);

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.lineTotalMinor, 0), [lines]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await submitCheckout({
      idempotencyKey: idempotencyKey.current,
      items,
      shipping: {
        fullName: formData.get('fullName'),
        phoneE164: formData.get('phoneE164'),
        alternatePhoneE164: formData.get('alternatePhoneE164') || undefined,
        addressLine: formData.get('addressLine'),
        city: formData.get('city'),
        province: formData.get('province'),
        postalCode: formData.get('postalCode') || undefined,
        landmark: formData.get('landmark') || undefined,
      },
      email: formData.get('email') || undefined,
      notes: formData.get('notes') || undefined,
      paymentMethod,
      couponCode: couponCode || undefined,
    });

    if (result.success && result.orderNumber && result.trackingToken) {
      clear();
      router.push(`/checkout/confirmation?order=${result.orderNumber}&token=${result.trackingToken}`);
      return;
    }

    setStatus('error');
    setErrorMessage(result.errorMessage ?? 'Something went wrong — please try again.');
    // A fresh idempotency key for the retry, since the failed attempt (e.g.
    // validation error) never created an order under the old key.
    idempotencyKey.current = crypto.randomUUID();
  }

  if (!linesLoading && lines.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="mb-4 font-display text-xl uppercase tracking-widest2 text-ink">Your cart is empty</p>
        <LinkButton href="/shop" variant="primary" size="md">
          Start Shopping
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 font-display text-sm uppercase tracking-widest2 text-ink">Contact</legend>
          <TextField name="email" label="Email (optional)" type="email" />
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 font-display text-sm uppercase tracking-widest2 text-ink">Delivery Address</legend>
          <TextField name="fullName" label="Full name" required autoComplete="name" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField name="phoneE164" label="Phone number" required placeholder="03XXXXXXXXX" autoComplete="tel" />
            <TextField name="alternatePhoneE164" label="Alternate phone (optional)" placeholder="03XXXXXXXXX" />
          </div>
          <TextField name="addressLine" label="Address" required autoComplete="street-address" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              name="city"
              label="City"
              required
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <SelectField name="province" label="Province" required defaultValue="">
              <option value="" disabled>
                Select province
              </option>
              {PAKISTANI_PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField name="postalCode" label="Postal code (optional)" />
            <TextField name="landmark" label="Landmark (optional)" />
          </div>
          <TextAreaField name="notes" label="Order notes (optional)" rows={3} />
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 font-display text-sm uppercase tracking-widest2 text-ink">Payment</legend>
          <label className="flex min-h-[44px] items-center gap-3 border border-ink/20 px-4 has-[:checked]:border-ink">
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === 'cod'}
              disabled={preview ? !preview.codEligible : false}
              onChange={() => setPaymentMethod('cod')}
            />
            <span className="text-sm">
              Cash on delivery{preview && !preview.codEligible ? ' (not available for this city)' : ''}
            </span>
          </label>
          <label className="flex min-h-[44px] items-center gap-3 border border-ink/20 px-4 has-[:checked]:border-ink">
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === 'bank_transfer'}
              onChange={() => setPaymentMethod('bank_transfer')}
            />
            <span className="text-sm">Bank transfer (upload proof after checkout)</span>
          </label>
        </fieldset>

        {errorMessage && (
          <p role="alert" className="text-sm text-burgundy">
            {errorMessage}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Placing order…' : 'Place Order'}
        </Button>
      </form>

      <aside className="h-fit border border-ink/10 p-6">
        <h2 className="mb-4 font-display text-sm uppercase tracking-widest2 text-ink">Order Summary</h2>
        <ul className="mb-4 flex flex-col gap-3 text-sm">
          {lines.map((l) => (
            <li key={l.sku} className="flex justify-between gap-2">
              <span className="text-ink-600">
                {l.title} × {l.quantity}
                <span className="block text-xs text-ink-400">
                  {l.size} / {l.colorName}
                </span>
              </span>
              <span className="shrink-0 text-ink">{formatPKR(l.lineTotalMinor)}</span>
            </li>
          ))}
        </ul>

        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Coupon code"
            className="min-h-[40px] flex-1 border border-ink/20 px-3 text-sm focus:border-ink focus:outline-none"
          />
        </div>
        {preview?.couponError && <p className="mb-3 text-xs text-burgundy">{preview.couponError}</p>}

        <div className="flex flex-col gap-2 border-t border-ink/10 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-600">Subtotal</span>
            <span>{formatPKR(preview?.subtotalMinor ?? subtotal)}</span>
          </div>
          {preview && preview.discountMinor > 0 && (
            <div className="flex justify-between text-burgundy">
              <span>Discount</span>
              <span>−{formatPKR(preview.discountMinor)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-ink-600">Shipping</span>
            <span>{preview?.shippingMinor !== null && preview?.shippingMinor !== undefined ? formatPKR(preview.shippingMinor) : 'Enter city'}</span>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-2 font-medium">
            <span>Total</span>
            <span>{preview?.totalMinor !== null && preview?.totalMinor !== undefined ? formatPKR(preview.totalMinor) : '—'}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
