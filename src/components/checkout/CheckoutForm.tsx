'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/lib/cart/cart-context';
import { useCartView } from '@/lib/cart/use-cart-view';
import { submitCheckout } from '@/lib/actions/checkout.actions';
import { previewCheckoutTotals, type CheckoutPreview } from '@/lib/actions/checkout-preview.actions';
import { PAKISTANI_PROVINCES } from '@/lib/constants/provinces';
import { TextField, SelectField, TextAreaField } from '@/components/ui/FormField';
import { Button, LinkButton } from '@/components/ui/Button';
import { formatPKR } from '@/lib/utils/money';

const SECTIONS = [
  { n: 1, label: 'Contact' },
  { n: 2, label: 'Delivery' },
  { n: 3, label: 'Payment' },
];

function SectionHeading({ n, title }: { n: number; title: string }) {
  return (
    <legend className="mb-1 flex items-center gap-3 font-display text-sm uppercase tracking-widest2 text-ink">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs text-ivory">
        {n}
      </span>
      {title}
    </legend>
  );
}

export function CheckoutForm() {
  const router = useRouter();
  const { items, clear } = useCart();
  const { lines, isLoading: linesLoading } = useCartView();

  const idempotencyKey = useRef(crypto.randomUUID());
  const [city, setCity] = useState('');
  const [couponInput, setCouponInput] = useState('');
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
      <div className="flex flex-col items-center gap-5 border border-dashed border-ink/20 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink/5 text-2xl" aria-hidden="true">
          🛍️
        </div>
        <p className="font-display text-xl uppercase tracking-widest2 text-ink">Your cart is empty</p>
        <LinkButton href="/shop" variant="primary" size="md">
          Start Shopping
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        <fieldset className="flex flex-col gap-4">
          <SectionHeading n={1} title="Contact" />
          <TextField name="email" label="Email (optional)" type="email" hint="For order updates — not required." />
        </fieldset>

        <fieldset className="flex flex-col gap-4 border-t border-ink/10 pt-8">
          <SectionHeading n={2} title="Delivery Address" />
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

        <fieldset className="flex flex-col gap-3 border-t border-ink/10 pt-8">
          <SectionHeading n={3} title="Payment" />
          <label
            className={`flex min-h-[64px] cursor-pointer items-center gap-4 border-2 px-4 py-3 transition-colors ${
              paymentMethod === 'cod' ? 'border-ink bg-ink/[0.03]' : 'border-ink/15 hover:border-ink/30'
            } ${preview && !preview.codEligible ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === 'cod'}
              disabled={preview ? !preview.codEligible : false}
              onChange={() => setPaymentMethod('cod')}
              className="h-4 w-4 accent-ink"
            />
            <span aria-hidden="true" className="text-xl">💵</span>
            <span>
              <span className="block text-sm font-medium text-ink">Cash on Delivery</span>
              <span className="block text-xs text-ink-400">
                {preview && !preview.codEligible ? 'Not available for this city' : 'Pay when it arrives'}
              </span>
            </span>
          </label>
          <label
            className={`flex min-h-[64px] cursor-pointer items-center gap-4 border-2 px-4 py-3 transition-colors ${
              paymentMethod === 'bank_transfer' ? 'border-ink bg-ink/[0.03]' : 'border-ink/15 hover:border-ink/30'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === 'bank_transfer'}
              onChange={() => setPaymentMethod('bank_transfer')}
              className="h-4 w-4 accent-ink"
            />
            <span aria-hidden="true" className="text-xl">🏦</span>
            <span>
              <span className="block text-sm font-medium text-ink">Bank Transfer</span>
              <span className="block text-xs text-ink-400">Upload payment proof after checkout</span>
            </span>
          </label>
        </fieldset>

        {errorMessage && (
          <p role="alert" className="bg-burgundy/10 px-4 py-3 text-sm text-burgundy">
            {errorMessage}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" disabled={status === 'submitting'} className="gap-2">
          <span aria-hidden="true">🔒</span>
          {status === 'submitting' ? 'Placing order…' : 'Place Order'}
        </Button>
      </form>

      <aside className="h-fit border border-ink/10 bg-ivory p-6 lg:sticky lg:top-24">
        <h2 className="mb-5 flex items-center gap-2 font-display text-sm uppercase tracking-widest2 text-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden="true" />
          Order Summary
        </h2>

        <ul className="mb-5 flex flex-col gap-4">
          {lines.map((l) => (
            <li key={l.sku} className="flex gap-3">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-ink/5">
                {l.imageUrl && <Image src={l.imageUrl} alt={l.title} fill sizes="56px" className="object-cover" />}
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-ivory">
                  {l.quantity}
                </span>
              </div>
              <div className="flex flex-1 items-start justify-between gap-2 text-sm">
                <span className="text-ink-600">
                  {l.title}
                  <span className="block text-xs text-ink-400">
                    {l.size} / {l.colorName}
                  </span>
                </span>
                <span className="shrink-0 text-ink">{formatPKR(l.lineTotalMinor)}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="mb-5 flex gap-2">
          <input
            type="text"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
            placeholder="Coupon code"
            className="min-h-[40px] flex-1 border border-ink/20 bg-ivory px-3 text-sm transition-colors hover:border-ink focus:border-ink focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setCouponCode(couponInput)}
            className="min-h-[40px] border border-ink px-4 text-xs uppercase tracking-widest2 text-ink transition-colors hover:bg-ink hover:text-ivory"
          >
            Apply
          </button>
        </div>
        {preview?.couponError && <p className="mb-3 text-xs text-burgundy">{preview.couponError}</p>}
        {!preview?.couponError && couponCode && preview && preview.discountMinor > 0 && (
          <p className="mb-3 text-xs text-ink-600">
            Coupon <span className="font-medium text-ink">{couponCode}</span> applied.
          </p>
        )}

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
            <span>
              {preview?.shippingMinor !== null && preview?.shippingMinor !== undefined
                ? formatPKR(preview.shippingMinor)
                : 'Enter city'}
            </span>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-3 font-display text-base">
            <span>Total</span>
            <span>
              {preview?.totalMinor !== null && preview?.totalMinor !== undefined ? formatPKR(preview.totalMinor) : '—'}
            </span>
          </div>
        </div>

        <ul className="mt-5 flex flex-col gap-2 border-t border-ink/10 pt-5 text-xs text-ink-600">
          <li className="flex items-center gap-2">
            <span aria-hidden="true">🔒</span>
            Secure checkout
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true">↺</span>
            7-day easy returns
          </li>
        </ul>
      </aside>
    </div>
  );
}
