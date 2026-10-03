'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { buildQueryString, getParamArray, getParam } from '@/lib/utils/query-params';
import { formatPKR } from '@/lib/utils/money';

export function AppliedFilterChips({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = Object.fromEntries(searchParams.entries());

  const chips: { key: string; label: string; remove: () => void }[] = [];

  for (const size of getParamArray(current, 'size')) {
    chips.push({
      key: `size-${size}`,
      label: `Size: ${size}`,
      remove: () => navigate({ size: getParamArray(current, 'size').filter((s) => s !== size) }),
    });
  }
  for (const color of getParamArray(current, 'color')) {
    chips.push({
      key: `color-${color}`,
      label: `Color: ${color}`,
      remove: () => navigate({ color: getParamArray(current, 'color').filter((c) => c !== color) }),
    });
  }
  const availability = getParam(current, 'availability');
  if (availability) {
    chips.push({
      key: 'availability',
      label: availability === 'in_stock' ? 'In stock' : 'Made to order',
      remove: () => navigate({ availability: null }),
    });
  }
  const minPrice = getParam(current, 'minPriceMinor');
  const maxPrice = getParam(current, 'maxPriceMinor');
  if (minPrice || maxPrice) {
    chips.push({
      key: 'price',
      label: `${minPrice ? formatPKR(Number(minPrice)) : '0'} – ${maxPrice ? formatPKR(Number(maxPrice)) : 'Any'}`,
      remove: () => navigate({ minPriceMinor: null, maxPriceMinor: null }),
    });
  }
  const q = getParam(current, 'q');
  if (q) {
    chips.push({ key: 'q', label: `Search: "${q}"`, remove: () => navigate({ q: null }) });
  }

  function navigate(patch: Record<string, string | string[] | null>) {
    router.push(`${basePath}?${buildQueryString(current, patch)}`);
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.remove}
          className="flex min-h-[36px] items-center gap-1.5 border border-ink/20 px-3 text-xs text-ink hover:border-ink"
        >
          {chip.label}
          <span aria-hidden="true">×</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() =>
          navigate({ size: null, color: null, availability: null, minPriceMinor: null, maxPriceMinor: null, q: null })
        }
        className="min-h-[36px] px-3 text-xs text-burgundy underline-offset-4 hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
