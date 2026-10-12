import Link from 'next/link';
import { panelClass } from './styles';

export function StatCard({
  label,
  value,
  hint,
  href,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  tone?: 'default' | 'alert' | 'accent';
}) {
  const toneClass =
    tone === 'alert' ? 'border-l-4 border-l-burgundy' : tone === 'accent' ? 'border-l-4 border-l-lime' : '';
  const body = (
    <div className={`${panelClass} ${toneClass} flex h-full flex-col gap-1 p-4`}>
      <p className="text-[11px] font-semibold uppercase tracking-widest2 text-ink-400">{label}</p>
      <p className="font-display text-2xl text-ink">{value}</p>
      {hint && <p className="text-xs text-ink-600">{hint}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-transform hover:-translate-y-0.5">
      {body}
    </Link>
  ) : (
    body
  );
}
