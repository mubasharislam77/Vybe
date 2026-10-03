'use client';

import { useEffect, useState } from 'react';
import { FilterPanel, type FilterOptions } from './FilterPanel';
import { Button } from '@/components/ui/Button';

export function FilterDrawer({ basePath, options }: { basePath: string; options: FilterOptions }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)} className="lg:hidden" aria-haspopup="dialog">
        Filters
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/50"
          />
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col overflow-y-auto bg-ivory p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-lg uppercase tracking-widest2">Filters</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-11 w-11 items-center justify-center text-2xl"
              >
                ×
              </button>
            </div>
            <FilterPanel basePath={basePath} options={options} onApplied={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
