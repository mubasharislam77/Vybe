const TONES = {
  neutral: 'bg-ink/5 text-ink-600',
  info: 'bg-ink text-ivory',
  success: 'bg-lime text-ink',
  warning: 'bg-amber-100 text-amber-900',
  danger: 'bg-burgundy text-ivory',
  muted: 'border border-ink/20 text-ink-400',
} as const;

type Tone = keyof typeof TONES;

const STATUS_TONE: Record<string, Tone> = {
  // fulfillment
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
  returned: 'muted',
  // payment
  awaiting_verification: 'warning',
  verified: 'success',
  failed: 'danger',
  refund_pending: 'warning',
  refunded: 'muted',
  // notification
  provider_accepted: 'info',
  // product / review / generic
  published: 'success',
  draft: 'muted',
  approved: 'success',
  rejected: 'danger',
  active: 'success',
  inactive: 'muted',
  admin: 'info',
  staff: 'neutral',
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = STATUS_TONE[status] ?? 'neutral';
  return (
    <span className={`inline-block whitespace-nowrap px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest2 ${TONES[tone]}`}>
      {label ?? status.replace(/_/g, ' ')}
    </span>
  );
}
