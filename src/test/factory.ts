import { ObjectId } from 'mongodb';
import type { Product, Address } from '@/types/domain';
import { insertProduct } from '@/lib/repositories/products.repo';
import { slugify } from '@/lib/utils/slug';

let counter = 0;

export function nextSku(prefix = 'TEST'): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export async function makeProduct(overrides: {
  title?: string;
  priceMinor?: number;
  stock?: number;
  fulfillment?: 'ready_stock' | 'made_to_order';
  productionLeadTimeDays?: number;
} = {}): Promise<Product> {
  const title = overrides.title ?? `Test Product ${Date.now()}-${++counter}`;
  const sku = nextSku();
  const now = new Date();
  const doc: Omit<Product, '_id'> = {
    slug: slugify(title) + '-' + counter,
    title,
    description: 'A test product used only by the automated test suite.',
    status: 'published',
    categoryIds: [],
    collectionIds: [],
    tags: [],
    audience: 'unisex',
    images: [{ url: 'https://example.com/placeholder.jpg', publicId: 'placeholder', alt: title, order: 0 }],
    featured: false,
    fulfillment: overrides.fulfillment ?? 'ready_stock',
    productionLeadTimeDays: overrides.productionLeadTimeDays,
    variants: [
      {
        sku,
        size: 'M',
        colorName: 'Black',
        colorSwatchHex: '#000000',
        priceMinor: overrides.priceMinor ?? 250000,
        stock: overrides.stock ?? 10,
        images: [],
      },
    ],
    salesCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  return insertProduct(doc);
}

export function makeAddress(overrides: Partial<Address> = {}): Address {
  return {
    fullName: 'Test Customer',
    phoneE164: '+923001234567',
    alternatePhoneE164: undefined,
    addressLine: '123 Test Street',
    city: 'Karachi',
    province: 'Sindh',
    ...overrides,
  };
}

export function fakeObjectId(): string {
  return new ObjectId().toString();
}
