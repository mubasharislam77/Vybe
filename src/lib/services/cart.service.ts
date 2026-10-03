import { products } from '@/lib/db/collections';
import type { CartItem } from '@/types/domain';

export interface CartLineView {
  sku: string;
  quantity: number;
  title: string;
  slug: string;
  size: string;
  colorName: string;
  colorSwatchHex: string | null;
  compareAtPriceMinor: number | null;
  imageUrl: string | null;
  unitPriceMinor: number;
  lineTotalMinor: number;
  fulfillment: 'ready_stock' | 'made_to_order';
  available: boolean;
  availableStock: number | null;
  productStatus: 'draft' | 'published' | 'not_found';
}

/**
 * Re-derives cart line display data (title/image/price/availability) from
 * the current catalog for every sku in the client-held cart — the cart
 * itself is a convenience; this is what makes the /cart page and checkout
 * review screen show numbers that are actually still true, not whatever
 * was cached in the browser when the item was added.
 */
export async function resolveCartView(items: CartItem[]): Promise<CartLineView[]> {
  if (items.length === 0) return [];
  const col = await products();
  const skus = items.map((i) => i.sku);
  const matchingProducts = await col.find({ 'variants.sku': { $in: skus } }).toArray();

  const bySku = new Map<string, { product: (typeof matchingProducts)[number]; variant: (typeof matchingProducts)[number]['variants'][number] }>();
  for (const product of matchingProducts) {
    for (const variant of product.variants) {
      if (skus.includes(variant.sku)) bySku.set(variant.sku, { product, variant });
    }
  }

  return items.map((item) => {
    const match = bySku.get(item.sku);
    if (!match) {
      return {
        sku: item.sku,
        quantity: item.quantity,
        title: 'No longer available',
        slug: '',
        size: '',
        colorName: '',
        colorSwatchHex: null,
        compareAtPriceMinor: null,
        imageUrl: null,
        unitPriceMinor: 0,
        lineTotalMinor: 0,
        fulfillment: 'ready_stock' as const,
        available: false,
        availableStock: null,
        productStatus: 'not_found' as const,
      };
    }
    const { product, variant } = match;
    const availableStock = product.fulfillment === 'ready_stock' ? variant.stock : null;
    const available =
      product.status === 'published' &&
      (product.fulfillment === 'made_to_order' || variant.stock >= item.quantity);

    return {
      sku: item.sku,
      quantity: item.quantity,
      title: product.title,
      slug: product.slug,
      size: variant.size,
      colorName: variant.colorName,
      colorSwatchHex: variant.colorSwatchHex,
      compareAtPriceMinor: variant.compareAtPriceMinor ?? null,
      imageUrl: variant.images[0]?.url ?? product.images[0]?.url ?? null,
      unitPriceMinor: variant.priceMinor,
      lineTotalMinor: variant.priceMinor * item.quantity,
      fulfillment: product.fulfillment,
      available,
      availableStock,
      productStatus: product.status,
    };
  });
}
