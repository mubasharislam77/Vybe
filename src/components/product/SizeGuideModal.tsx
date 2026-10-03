'use client';

import { useEffect, useState } from 'react';

const CHART = [
  { size: 'S', chest: '38–40"', length: '27"' },
  { size: 'M', chest: '40–42"', length: '28"' },
  { size: 'L', chest: '42–44"', length: '29"' },
  { size: 'XL', chest: '44–46"', length: '30"' },
  { size: 'XXL', chest: '46–48"', length: '31"' },
];

export function SizeGuideModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-ink underline-offset-4 hover:text-burgundy hover:underline"
      >
        Size guide
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Size guide"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4"
        >
          <button
            type="button"
            aria-label="Close size guide"
            onClick={() => setOpen(false)}
            className="absolute inset-0"
          />
          <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto bg-ivory p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg uppercase tracking-widest2">Size Guide</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-11 w-11 items-center justify-center text-2xl"
              >
                ×
              </button>
            </div>
            <p className="mb-4 text-xs text-ink-400">
              Measurements are body measurements in inches — this is a general guide; fit can vary by style. Oversized
              fits run roomy by design.
            </p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink/20 text-left">
                  <th className="py-2 font-display text-xs uppercase tracking-widest2">Size</th>
                  <th className="py-2 font-display text-xs uppercase tracking-widest2">Chest</th>
                  <th className="py-2 font-display text-xs uppercase tracking-widest2">Length</th>
                </tr>
              </thead>
              <tbody>
                {CHART.map((row) => (
                  <tr key={row.size} className="border-b border-ink/10">
                    <td className="py-2">{row.size}</td>
                    <td className="py-2">{row.chest}</td>
                    <td className="py-2">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
