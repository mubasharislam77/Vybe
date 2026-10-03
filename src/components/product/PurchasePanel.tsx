'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart/cart-context';
import { useWishlist } from '@/lib/wishlist/wishlist-context';
import { PriceTag } from '@/components/ui/PriceTag';
import { Button } from '@/components/ui/Button';
import { SizeGuideModal } from './SizeGuideModal';

export interface PlainVariant {
  sku: string;
  size: string;
  colorName: string;
  colorSwatchHex: string;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  stock: number;
  images: { url: string; alt: string }[];
}

export function PurchasePanel({
  slug,
  title,
  variants,
  fulfillment,
  productionLeadTimeDays,
  fabric,
  fit,
  careInstructions,
  onVariantChange,
}: {
  slug: string;
  title: string;
  variants: PlainVariant[];
  fulfillment: 'ready_stock' | 'made_to_order';
  productionLeadTimeDays?: number;
  fabric?: string;
  fit?: string;
  careInstructions?: string;
  onVariantChange?: (variant: PlainVariant | null) => void;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();

  const sizes = useMemo(() => Array.from(new Set(variants.map((v) => v.size))), [variants]);
  const colors = useMemo(() => {
    const seen = new Map<string, string>();
    for (const v of variants) if (!seen.has(v.colorName)) seen.set(v.colorName, v.colorSwatchHex);
    return Array.from(seen.entries()).map(([name, hex]) => ({ name, hex }));
  }, [variants]);

  const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] ?? null);
  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0]?.name ?? null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  const selectedVariant =
    variants.find((v) => v.size === selectedSize && v.colorName === selectedColor) ?? null;

  function pickSize(size: string) {
    setSelectedSize(size);
    const match = variants.find((v) => v.size === size && v.colorName === selectedColor);
    const next = match ?? variants.find((v) => v.size === size) ?? null;
    if (next) {
      setSelectedColor(next.colorName);
      onVariantChange?.(next);
    }
  }

  function pickColor(colorName: string) {
    setSelectedColor(colorName);
    const match = variants.find((v) => v.colorName === colorName && v.size === selectedSize);
    const next = match ?? variants.find((v) => v.colorName === colorName) ?? null;
    if (next) {
      setSelectedSize(next.size);
      onVariantChange?.(next);
    }
  }

  const inStock = selectedVariant && (fulfillment === 'made_to_order' || selectedVariant.stock > 0);
  const maxQty = selectedVariant
    ? fulfillment === 'made_to_order'
      ? 10
      : Math.min(10, selectedVariant.stock)
    : 1;

  function handleAddToCart() {
    if (!selectedVariant) {
      setMessage('Please select a size and color.');
      return;
    }
    addItem(selectedVariant.sku, quantity);
    setMessage(`Added ${quantity} to cart.`);
  }

  function handleBuyNow() {
    if (!selectedVariant) {
      setMessage('Please select a size and color.');
      return;
    }
    addItem(selectedVariant.sku, quantity);
    router.push('/checkout');
  }

  const isWishlisted = has(slug);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-tight text-ink sm:text-4xl">{title}</h1>
        {selectedVariant && (
          <div className="mt-2">
            <PriceTag
              minPriceMinor={selectedVariant.priceMinor}
              compareAtMinor={selectedVariant.compareAtPriceMinor}
              size="lg"
            />
          </div>
        )}
      </div>

      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-ink-600">
            Color{selectedColor ? `: ${selectedColor}` : ''}
          </p>
          <div className="flex flex-wrap gap-3">
            {colors.map((c) => (
              <button
                key={c.name}
                type="button"
                aria-pressed={selectedColor === c.name}
                aria-label={c.name}
                title={c.name}
                onClick={() => pickColor(c.name)}
                className={`h-11 w-11 rounded-full border-2 transition-all ${
                  selectedColor === c.name ? 'border-ink' : 'border-transparent hover:border-ink/40'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-ink-600">Size</p>
            <SizeGuideModal />
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const variantForSize = variants.find((v) => v.size === size && v.colorName === selectedColor);
              const available =
                variantForSize && (fulfillment === 'made_to_order' || variantForSize.stock > 0);
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={selectedSize === size}
                  disabled={!variantForSize}
                  onClick={() => pickSize(size)}
                  className={`relative min-h-[44px] min-w-[44px] border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                    selectedSize === size ? 'border-ink bg-ink text-ivory' : 'border-ink/20 text-ink hover:border-ink'
                  } ${variantForSize && !available ? 'opacity-40' : ''}`}
                >
                  {size}
                  {variantForSize && !available && <span className="sr-only"> (out of stock)</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm text-ink-600">Quantity</p>
        <div className="flex h-11 w-32 items-stretch border border-ink/20">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex-1 text-lg"
          >
            −
          </button>
          <span className="flex flex-1 items-center justify-center text-sm" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            className="flex-1 text-lg"
          >
            +
          </button>
        </div>
      </div>

      {!inStock && selectedVariant && (
        <p className="text-sm text-burgundy" role="alert">
          This size/color is currently out of stock.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="primary" size="lg" className="flex-1" onClick={handleAddToCart} disabled={!inStock}>
          Add to Cart
        </Button>
        <Button variant="secondary" size="lg" className="flex-1" onClick={handleBuyNow} disabled={!inStock}>
          Buy Now
        </Button>
        <button
          type="button"
          onClick={() => toggle(slug)}
          aria-pressed={isWishlisted}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-ink/20 text-xl hover:border-ink"
        >
          {isWishlisted ? '♥' : '♡'}
        </button>
      </div>

      {message && (
        <p role="status" className="text-sm text-ink-600">
          {message}
        </p>
      )}

      <div className="border-t border-ink/10 pt-6 text-sm text-ink-600">
        <p>
          {fulfillment === 'made_to_order'
            ? `Made to order — ships in ${productionLeadTimeDays ?? 7}–${(productionLeadTimeDays ?? 7) + 3} days.`
            : 'Ready stock — ships in 1–2 business days.'}
        </p>
        {fabric && <p className="mt-2">Fabric: {fabric}</p>}
        {fit && <p className="mt-1">Fit: {fit}</p>}
        {careInstructions && <p className="mt-1">Care: {careInstructions}</p>}
      </div>
    </div>
  );
}
