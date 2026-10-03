'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatPKR } from '@/lib/utils/money';
import type { CartLineView } from '@/lib/services/cart.service';

export function CartLineItem({
  line,
  onSetQuantity,
  onRemove,
}: {
  line: CartLineView;
  onSetQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex gap-5 border border-ink/10 bg-ivory p-4 sm:gap-6 sm:p-5">
      <Link
        href={line.slug ? `/products/${line.slug}` : '#'}
        className="relative h-32 w-28 shrink-0 overflow-hidden bg-ink/5 sm:h-36 sm:w-32"
        tabIndex={line.slug ? 0 : -1}
        aria-hidden={!line.slug}
      >
        {line.imageUrl && (
          <Image src={line.imageUrl} alt={line.title} fill sizes="128px" className="object-cover" />
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            {line.slug ? (
              <Link
                href={`/products/${line.slug}`}
                className="font-display text-sm uppercase tracking-tight text-ink hover:text-burgundy sm:text-base"
              >
                {line.title}
              </Link>
            ) : (
              <p className="font-display text-sm uppercase tracking-tight text-burgundy sm:text-base">{line.title}</p>
            )}

            <div className="mt-1.5 flex items-center gap-2 text-xs text-ink-400">
              {line.colorSwatchHex && (
                <span
                  className="inline-block h-3 w-3 rounded-full border border-ink/10"
                  style={{ backgroundColor: line.colorSwatchHex }}
                  aria-hidden="true"
                />
              )}
              <span>
                {line.size} {line.colorName && `/ ${line.colorName}`}
              </span>
            </div>

            {!line.available && (
              <p className="mt-2 inline-block bg-burgundy/10 px-2 py-1 text-xs text-burgundy" role="alert">
                {line.productStatus === 'not_found'
                  ? 'No longer available'
                  : `Only ${line.availableStock ?? 0} left in stock`}
              </p>
            )}
          </div>

          <button
            type="button"
            aria-label={`Remove ${line.title} from cart`}
            onClick={onRemove}
            className="flex h-9 w-9 shrink-0 items-center justify-center text-ink-400 transition-colors hover:text-burgundy"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M2 4h12M6 4V2.5h4V4M3.5 4l.5 9.5a1 1 0 0 0 1 .95h6a1 1 0 0 0 1-.95L12.5 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="flex items-end justify-between">
          <div className="flex h-10 items-stretch border border-ink/20 text-sm">
            <button
              type="button"
              aria-label={`Decrease quantity of ${line.title}`}
              onClick={() => onSetQuantity(line.quantity - 1)}
              className="w-9 text-ink transition-colors hover:bg-ink/5"
            >
              −
            </button>
            <span className="flex w-9 items-center justify-center font-medium" aria-live="polite">
              {line.quantity}
            </span>
            <button
              type="button"
              aria-label={`Increase quantity of ${line.title}`}
              onClick={() => onSetQuantity(line.quantity + 1)}
              className="w-9 text-ink transition-colors hover:bg-ink/5"
            >
              +
            </button>
          </div>

          <div className="text-right">
            {line.quantity > 1 && (
              <p className="text-xs text-ink-400">{formatPKR(line.unitPriceMinor)} each</p>
            )}
            <p className="font-display text-base text-ink">{formatPKR(line.lineTotalMinor)}</p>
          </div>
        </div>
      </div>
    </li>
  );
}
