'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { buildQueryString, getParamArray, getParam } from '@/lib/utils/query-params';
import { Button } from '@/components/ui/Button';

export interface FilterOptions {
  sizes: string[];
  colors: { name: string; hex: string }[];
}

export function FilterPanel({
  basePath,
  options,
  onApplied,
}: {
  basePath: string;
  options: FilterOptions;
  onApplied?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = Object.fromEntries(searchParams.entries());
  const [draft, setDraft] = useState(() => ({
    size: getParamArray(current, 'size'),
    color: getParamArray(current, 'color'),
    availability: getParam(current, 'availability') ?? 'all',
    minPriceMinor: getParam(current, 'minPriceMinor') ?? '',
    maxPriceMinor: getParam(current, 'maxPriceMinor') ?? '',
  }));

  function toggle(key: 'size' | 'color', value: string) {
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value],
    }));
  }

  function apply() {
    const qs = buildQueryString(current, {
      size: draft.size.length ? draft.size : null,
      color: draft.color.length ? draft.color : null,
      availability: draft.availability === 'all' ? null : draft.availability,
      minPriceMinor: draft.minPriceMinor || null,
      maxPriceMinor: draft.maxPriceMinor || null,
    });
    router.push(`${basePath}?${qs}`);
    onApplied?.();
  }

  function clearAll() {
    setDraft({ size: [], color: [], availability: 'all', minPriceMinor: '', maxPriceMinor: '' });
    const qs = buildQueryString(current, {
      size: null,
      color: null,
      availability: null,
      minPriceMinor: null,
      maxPriceMinor: null,
    });
    router.push(`${basePath}?${qs}`);
    onApplied?.();
  }

  return (
    <div className="flex flex-col gap-7 border border-ink/10 bg-ivory p-5">
      <fieldset>
        <legend className="mb-3 flex items-center gap-2 font-display text-xs uppercase tracking-widest2 text-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden="true" />
          Size
        </legend>
        <div className="flex flex-wrap gap-2">
          {options.sizes.map((size) => {
            const active = draft.size.includes(size);
            return (
              <button
                key={size}
                type="button"
                aria-pressed={active}
                onClick={() => toggle('size', size)}
                className={`min-h-[44px] min-w-[44px] border px-3 text-sm transition-colors ${
                  active ? 'border-ink bg-ink text-ivory' : 'border-ink/20 text-ink hover:border-ink'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="border-t border-ink/10 pt-6">
        <legend className="mb-3 flex items-center gap-2 font-display text-xs uppercase tracking-widest2 text-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden="true" />
          Color
        </legend>
        <div className="flex flex-wrap gap-3">
          {options.colors.map((color) => {
            const active = draft.color.includes(color.name);
            return (
              <button
                key={color.name}
                type="button"
                aria-pressed={active}
                aria-label={color.name}
                title={color.name}
                onClick={() => toggle('color', color.name)}
                className={`relative h-11 w-11 rounded-full border-2 transition-all ${
                  active ? 'border-ink' : 'border-transparent hover:border-ink/40'
                }`}
                style={{ backgroundColor: color.hex }}
              >
                {active && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-ivory mix-blend-difference">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="border-t border-ink/10 pt-6">
        <legend className="mb-3 flex items-center gap-2 font-display text-xs uppercase tracking-widest2 text-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden="true" />
          Price (PKR)
        </legend>
        <div className="flex items-center gap-3">
          <div className="relative w-full">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">Rs</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={draft.minPriceMinor ? Number(draft.minPriceMinor) / 100 : ''}
              onChange={(e) => setDraft((d) => ({ ...d, minPriceMinor: e.target.value ? String(Math.round(Number(e.target.value) * 100)) : '' }))}
              className="min-h-[44px] w-full border border-ink/20 bg-ivory py-2 pl-8 pr-2 text-sm transition-colors hover:border-ink focus:border-ink focus:outline-none"
            />
          </div>
          <span className="text-ink-400">–</span>
          <div className="relative w-full">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">Rs</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={draft.maxPriceMinor ? Number(draft.maxPriceMinor) / 100 : ''}
              onChange={(e) => setDraft((d) => ({ ...d, maxPriceMinor: e.target.value ? String(Math.round(Number(e.target.value) * 100)) : '' }))}
              className="min-h-[44px] w-full border border-ink/20 bg-ivory py-2 pl-8 pr-2 text-sm transition-colors hover:border-ink focus:border-ink focus:outline-none"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="border-t border-ink/10 pt-6">
        <legend className="mb-3 flex items-center gap-2 font-display text-xs uppercase tracking-widest2 text-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden="true" />
          Availability
        </legend>
        <div className="flex flex-col gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'in_stock', label: 'In stock' },
            { value: 'made_to_order', label: 'Made to order' },
          ].map((opt) => (
            <label key={opt.value} className="flex min-h-[44px] items-center gap-2 text-sm">
              <input
                type="radio"
                name="availability"
                checked={draft.availability === opt.value}
                onChange={() => setDraft((d) => ({ ...d, availability: opt.value }))}
                className="h-4 w-4"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-3 border-t border-ink/10 pt-6">
        <Button variant="primary" size="sm" onClick={apply} className="flex-1">
          Apply
        </Button>
        <Button variant="secondary" size="sm" onClick={clearAll} className="flex-1">
          Clear all
        </Button>
      </div>
    </div>
  );
}
