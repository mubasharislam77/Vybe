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
    <label className="relative flex items-center">
      <span className="sr-only">Sort products</span>
      <select
        value={value}
        onChange={(e) => {
          const qs = buildQueryString(current, { sort: e.target.value });
          router.push(`${basePath}?${qs}`);
        }}
        className="min-h-[44px] appearance-none border border-ink/20 bg-ivory py-2 pl-4 pr-9 font-display text-xs uppercase tracking-widest2 text-ink transition-colors hover:border-ink focus:border-ink focus:outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        width="10"
        height="10"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
        className="pointer-events-none absolute right-3 text-ink"
      >
        <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}
