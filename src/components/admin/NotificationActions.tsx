'use client';

import { retryNotification, runNotificationWorkerNow, type WorkerRunResult } from '@/lib/actions/admin/notifications.actions';
import { ActionButton } from './ActionButton';

function summarizeRun(data: unknown): string {
  const r = data as WorkerRunResult | undefined;
  if (!r) return 'Worker ran.';
  const line = (label: string, s: WorkerRunResult['email']) =>
    `${label}: ${s.sent} sent, ${s.failed} failed${s.skippedUnconfigured ? `, ${s.skippedUnconfigured} skipped (not configured)` : ''}`;
  return `${line('Email', r.email)} · ${line('WhatsApp', r.whatsapp)}`;
}

export function RunWorkerButton() {
  return (
    <ActionButton action={runNotificationWorkerNow} variant="primary" successMessage={summarizeRun}>
      Run worker now
    </ActionButton>
  );
}

export function RetryNotificationButton({ id }: { id: string }) {
  return (
    <ActionButton action={() => retryNotification(id)} className="min-h-[32px] px-2 text-[11px]" successMessage={summarizeRun}>
      Retry now
    </ActionButton>
  );
}
