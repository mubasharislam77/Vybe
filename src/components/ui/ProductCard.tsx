import Link from 'next/link';
import Image from 'next/image';
import { PriceTag } from './PriceTag';
import { Badge } from './Badge';

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

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-ink/5">
        <Image
          src={product.imageUrl}
          alt={product.imageAlt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.featured && <Badge tone="lime">Featured</Badge>}
          {product.fulfillment === 'made_to_order' && <Badge tone="outline">Made to order</Badge>}
          {product.compareAtMinor && <Badge tone="burgundy">Sale</Badge>}
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="text-sm text-ink">{product.title}</h3>
        <PriceTag
          minPriceMinor={product.minPriceMinor}
          maxPriceMinor={product.maxPriceMinor}
          compareAtMinor={product.compareAtMinor}
          size="sm"
        />
      </div>
    </Link>
  );
}
