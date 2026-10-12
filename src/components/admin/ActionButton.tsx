'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminActionResult } from '@/lib/actions/admin/_shared';
import { smallButtonBaseClass } from './styles';

/**
 * Runs a pre-bound server action (e.g. `updateOrderStatus.bind(null, id, 'confirmed')`)
 * with optional confirmation, a pending state, inline error, and a router
 * refresh on success so the surrounding server-rendered page re-reads the DB.
 */
export function ActionButton({
  action,
  children,
  confirm,
  variant = 'default',
  className = '',
  successMessage,
  onSuccess,
}: {
  action: () => Promise<AdminActionResult<unknown>>;
  children: React.ReactNode;
  confirm?: string;
  variant?: 'default' | 'primary' | 'danger';
  className?: string;
  successMessage?: string | ((data: unknown) => string);
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  // Colour classes live entirely here (not in the shared base) so variants
  // never compete with the base's bg/text utilities in the generated CSS.
  const variantClass =
    variant === 'primary'
      ? 'border-ink bg-ink text-ivory hover:border-lime hover:bg-lime hover:text-ink'
      : variant === 'danger'
        ? 'border-burgundy/40 bg-white text-burgundy hover:border-burgundy hover:bg-burgundy hover:text-ivory'
        : 'border-ink/20 bg-white text-ink hover:border-ink hover:bg-ink hover:text-ivory';

  function run() {
    if (confirm && !window.confirm(confirm)) return;
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setMessage({ kind: 'error', text: result.errorMessage ?? 'Something went wrong.' });
        return;
      }
      if (successMessage) {
        setMessage({ kind: 'success', text: typeof successMessage === 'function' ? successMessage(result.data) : successMessage });
      }
      onSuccess?.();
      router.refresh();
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={run} disabled={pending} className={`${smallButtonBaseClass} ${variantClass} ${className}`}>
        {pending ? 'Working…' : children}
      </button>
      {message && (
        <span role={message.kind === 'error' ? 'alert' : 'status'} className={`text-xs ${message.kind === 'error' ? 'text-burgundy' : 'text-ink-600'}`}>
          {message.text}
        </span>
      )}
    </span>
  );
}
