'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { buildQueryString } from '@/lib/utils/query-params';

const OPTIONS: { value: string; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'best_selling', label: 'Best selling' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

export function SortSelect({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = Object.fromEntries(searchParams.entries());
  const value = current.sort ?? 'newest';

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-ink-400">Sort</span>
      <select
        value={value}
        onChange={(e) => {
          const qs = buildQueryString(current, { sort: e.target.value });
          router.push(`${basePath}?${qs}`);
        }}
        className="min-h-[44px] border border-ink/20 bg-ivory px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
