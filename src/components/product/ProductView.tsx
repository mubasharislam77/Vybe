'use client';

import { useState } from 'react';
import { Gallery, type GalleryImage } from './Gallery';
import { PurchasePanel, type PlainVariant } from './PurchasePanel';

export function ProductView({
  slug,
  title,
  productImages,
  variants,
  fulfillment,
  productionLeadTimeDays,
  fabric,
  fit,
  careInstructions,
}: {
  slug: string;
  title: string;
  productImages: GalleryImage[];
  variants: PlainVariant[];
  fulfillment: 'ready_stock' | 'made_to_order';
  productionLeadTimeDays?: number;
  fabric?: string;
  fit?: string;
  careInstructions?: string;
}) {
  const [activeVariant, setActiveVariant] = useState<PlainVariant | null>(variants[0] ?? null);

  const images: GalleryImage[] =
    activeVariant && activeVariant.images.length > 0 ? activeVariant.images : productImages;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
      <Gallery images={images} title={title} />
      <PurchasePanel
        slug={slug}
        title={title}
        variants={variants}
        fulfillment={fulfillment}
        productionLeadTimeDays={productionLeadTimeDays}
        fabric={fabric}
        fit={fit}
        careInstructions={careInstructions}
        onVariantChange={setActiveVariant}
      />
    </div>
  );
}
