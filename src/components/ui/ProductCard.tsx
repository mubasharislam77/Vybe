'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PriceTag } from './PriceTag';
import { Badge } from './Badge';
import { useWishlist } from '@/lib/wishlist/wishlist-context';

export interface ProductCardData {
  slug: string;
  title: string;
  imageUrl: string;
  imageAlt: string;
  minPriceMinor: number;
  maxPriceMinor: number;
  compareAtMinor: number | null;
  featured?: boolean;
  fulfillment: 'ready_stock' | 'made_to_order';
}

function priorityBadge(product: ProductCardData): { label: string; tone: 'burgundy' | 'lime' | 'outline' } | null {
  if (product.compareAtMinor) return { label: 'Sale', tone: 'burgundy' };
  if (product.featured) return { label: 'Featured', tone: 'lime' };
  if (product.fulfillment === 'made_to_order') return { label: 'Made to order', tone: 'outline' };
  return null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const { has, toggle } = useWishlist();
  const badge = priorityBadge(product);
  const wishlisted = has(product.slug);

  return (
    <div className="group relative border border-ink/12 bg-ivory transition-all duration-300 ease-out hover:-translate-y-1 hover:border-ink hover:shadow-[0_16px_28px_-16px_rgba(23,23,23,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-ink/5">
          <Image
            src={product.imageUrl}
            alt={product.imageAlt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          {badge && (
            <div className="absolute left-2 top-2">
              <Badge tone={badge.tone}>{badge.label}</Badge>
            </div>
          )}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-lime opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1 p-3">
          <h3 className="text-sm text-ink transition-colors group-hover:text-burgundy">{product.title}</h3>
          <PriceTag
            minPriceMinor={product.minPriceMinor}
            maxPriceMinor={product.maxPriceMinor}
            compareAtMinor={product.compareAtMinor}
            size="sm"
          />
        </div>
      </Link>

      <button
        type="button"
        aria-label={wishlisted ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
        aria-pressed={wishlisted}
        onClick={(e) => {
          e.preventDefault();
          toggle(product.slug);
        }}
        className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 text-base shadow-sm backdrop-blur-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100 ${
          wishlisted ? 'text-burgundy opacity-100' : 'text-ink'
        }`}
      >
        {wishlisted ? '♥' : '♡'}
      </button>
    </div>
  );
}
