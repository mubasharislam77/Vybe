'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveCoupon } from '@/lib/actions/admin/coupons.actions';
import { TextField, SelectField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '../FormMessage';

export interface CouponFormValues {
  code: string;
  type: 'percent' | 'fixed';
  /** percent: 0-100; fixed: minor units */
  value: number;
  minSpendMinor?: number;
  usageLimit?: number;
  perCustomerLimit?: number;
  startsAt?: string;
  expiresAt?: string;
  active: boolean;
}

function num(value: string): number | undefined {
  const t = value.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

export function CouponForm({ couponId, initial, onSaved }: { couponId: string | null; initial?: CouponFormValues; onSaved?: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState(initial?.code ?? '');
  const [type, setType] = useState<'percent' | 'fixed'>(initial?.type ?? 'percent');
  const [value, setValue] = useState(
    initial ? (initial.type === 'fixed' ? String(initial.value / 100) : String(initial.value)) : '',
  );
  const [minSpend, setMinSpend] = useState(initial?.minSpendMinor ? String(initial.minSpendMinor / 100) : '');
  const [usageLimit, setUsageLimit] = useState(initial?.usageLimit ? String(initial.usageLimit) : '');
  const [perCustomerLimit, setPerCustomerLimit] = useState(initial?.perCustomerLimit ? String(initial.perCustomerLimit) : '');
  const [startsAt, setStartsAt] = useState(initial?.startsAt ?? '');
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt ?? '');
  const [active, setActive] = useState(initial?.active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const rawValue = num(value) ?? 0;
    const result = await saveCoupon(couponId, {
      code: code.trim().toUpperCase(),
      type,
      value: type === 'fixed' ? Math.round(rawValue * 100) : rawValue,
      minSpendMinor: num(minSpend) !== undefined ? Math.round((num(minSpend) as number) * 100) : undefined,
      usageLimit: num(usageLimit),
      perCustomerLimit: num(perCustomerLimit),
      startsAt: startsAt || undefined,
      expiresAt: expiresAt || undefined,
      active,
    });
    setSubmitting(false);
    if (!result.success) {
      setError(result.errorMessage ?? 'Could not save.');
      return;
    }
    if (!couponId) {
      setCode('');
      setValue('');
      setMinSpend('');
      setUsageLimit('');
      setPerCustomerLimit('');
      setStartsAt('');
      setExpiresAt('');
    }
    onSaved?.();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <TextField label="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required hint="3-20 letters/numbers, - or _" className="uppercase" />
      <SelectField label="Type" value={type} onChange={(e) => setType(e.target.value as 'percent' | 'fixed')}>
        <option value="percent">Percent off</option>
        <option value="fixed">Fixed amount off (PKR)</option>
      </SelectField>
      <TextField label={type === 'percent' ? 'Percent (1-100)' : 'Amount (PKR)'} type="number" min={1} max={type === 'percent' ? 100 : undefined} step="1" value={value} onChange={(e) => setValue(e.target.value)} required />
      <TextField label="Minimum spend (PKR)" type="number" min={0} step="1" value={minSpend} onChange={(e) => setMinSpend(e.target.value)} hint="Optional" />
      <TextField label="Total usage limit" type="number" min={1} step="1" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} hint="Optional — blank for unlimited" />
      <TextField label="Per-customer limit" type="number" min={1} step="1" value={perCustomerLimit} onChange={(e) => setPerCustomerLimit(e.target.value)} hint="Optional (recorded; not enforced for guest checkout)" />
      <TextField label="Starts" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
      <TextField label="Expires" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
      <label className="flex items-center gap-2 self-end pb-3 text-sm">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-ink" />
        Active
      </label>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Saving…' : couponId ? 'Save coupon' : 'Create coupon'}
        </Button>
        <FormMessage error={error} />
      </div>
    </form>
  );
}
