'use client';

import { useState } from 'react';
import { smallButtonClass } from './styles';

/** Minimal "Edit ▸ form" toggle for inline editors in list pages. */
export function Disclosure({
  label,
  openLabel = 'Close',
  children,
  defaultOpen = false,
  className = '',
}: {
  label: string;
  openLabel?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={className}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={smallButtonClass}>
        {open ? openLabel : label}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
