import { formatPKR } from '@/lib/utils/money';

export function PriceTag({
  minPriceMinor,
  maxPriceMinor,
  compareAtMinor,
  size = 'md',
}: {
  minPriceMinor: number;
  maxPriceMinor?: number;
  compareAtMinor?: number | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const textSize = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-base';
  const isRange = maxPriceMinor !== undefined && maxPriceMinor > minPriceMinor;

  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-semibold text-ink ${textSize}`}>
        {isRange ? `From ${formatPKR(minPriceMinor)}` : formatPKR(minPriceMinor)}
      </span>
      {compareAtMinor && compareAtMinor > minPriceMinor && (
        <span className="text-sm text-ink-400 line-through">{formatPKR(compareAtMinor)}</span>
      )}
    </div>
  );
}
