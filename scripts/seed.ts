import './_env';
import { MongoClient, ObjectId } from 'mongodb';
import type { Product, Category, ProductCollection, Coupon, StoreSettings } from '../src/types/domain';
import { slugify } from '../src/lib/utils/slug';

/**
 * Safe, re-runnable sample-data seeding (spec section 12). Refuses to run
 * against a database that already has products unless --reset is passed,
 * which drops only catalog/marketing collections (products, categories,
 * collections, coupons, store_settings) — never orders, customers, or
 * staff accounts, so a seed can't ever wipe real transactional data.
 *
 * Usage:
 *   npm run db:seed                 # ~48 realistic demo products
 *   npm run db:seed -- --reset      # drop + reseed the catalog
 *   npm run db:seed:bench           # --count=10000, for perf benchmarking
 *     (synthetic variations of the same demo images/copy — clearly
 *     sample data, never passed off as a real catalog)
 */

function parseFlags(argv: string[]) {
  const flags: Record<string, string | boolean> = {};
  for (const arg of argv) {
    const m = /^--([a-z]+)(?:=(.*))?$/.exec(arg);
    if (m) flags[m[1]] = m[2] ?? true;
  }
  return flags;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const DEMO_IMAGES = [
  'hoodie-01.jpg',
  'hoodie-02.jpg',
  'hoodie-03.jpg',
  'street-01.jpg',
  'street-02.jpg',
  'street-03.jpg',
  'tee-01.jpg',
  'tee-02.jpg',
  'tee-03.jpg',
];

function img(name: string, alt: string, order = 0) {
  return { url: `${SITE_URL}/products/${name}`, publicId: `seed/${name}`, alt, order };
}

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const COLORS: { name: string; hex: string }[] = [
  { name: 'Ink Black', hex: '#171717' },
  { name: 'Warm Ivory', hex: '#F4F0E8' },
  { name: 'Burgundy', hex: '#6B2438' },
  { name: 'Electric Lime', hex: '#D8F36A' },
];

interface CategorySeed {
  slug: string;
  name: string;
  children: { slug: string; name: string }[];
}

const CATEGORY_TREE: CategorySeed[] = [
  {
    slug: 'tops',
    name: 'Tops',
    children: [
      { slug: 't-shirts', name: 'T-Shirts' },
      { slug: 'oversized-tees', name: 'Oversized Tees' },
      { slug: 'full-sleeve-tees', name: 'Full-Sleeve Tees' },
    ],
  },
  {
    slug: 'winterwear',
    name: 'Winterwear',
    children: [
      { slug: 'sweatshirts', name: 'Sweatshirts' },
      { slug: 'hoodies', name: 'Hoodies' },
    ],
  },
];

const COLLECTIONS: { slug: string; name: string; description: string }[] = [
  { slug: 'monsoon-drop', name: 'Monsoon Drop', description: 'The season’s first capsule — built for Karachi rain and Lahore haze.' },
  { slug: 'calligraphy-capsule', name: 'Calligraphy Capsule', description: 'Urdu type treatments, screen-printed heavy.' },
  { slug: 'anime-capsule', name: 'Anime Capsule', description: 'Anime-inspired graphics for the terminally online.' },
];

const TAGS = ['graphic', 'minimal', 'cultural', 'anime', 'seasonal'];

const PRODUCT_NAMES = [
  'Static Hoodie',
  'Tarka Oversized Tee',
  'Nostalgia Crewneck',
  'Rebel Calligraphy Tee',
  'Loop-Knit Sweatshirt',
  'Boxy Heavy Tee',
  'Back-Print Hoodie',
  'Minimal Mark Tee',
  'Full-Sleeve Layer Tee',
  'Desi Pop Hoodie',
];

function randomChoice<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function buildProduct(index: number, categoryIds: Map<string, ObjectId>, collectionIds: ObjectId[]): Omit<Product, '_id'> {
  const name = randomChoice(PRODUCT_NAMES, index);
  const title = index < PRODUCT_NAMES.length ? name : `${name} ${Math.floor(index / PRODUCT_NAMES.length) + 1}`;
  const fulfillment = index % 7 === 0 ? 'made_to_order' : 'ready_stock';
  const audience = (['men', 'women', 'unisex'] as const)[index % 3];
  const basePrice = 250000 + (index % 6) * 50000; // PKR 2500 - 5000, in minor units
  const isHoodie = /hoodie/i.test(title);
  const isSweatshirt = /sweatshirt|crewneck/i.test(title);
  const categorySlug = isHoodie ? 'hoodies' : isSweatshirt ? 'sweatshirts' : index % 2 === 0 ? 'oversized-tees' : 't-shirts';
  const categoryId = categoryIds.get(categorySlug);
  const images = [img(DEMO_IMAGES[index % DEMO_IMAGES.length], title, 0)];

  const variants = SIZES.flatMap((size, si) =>
    COLORS.slice(0, 2 + (index % 3)).map((color, ci) => ({
      sku: `VYB-${slugify(title)}-${size}-${slugify(color.name)}-${index}`.slice(0, 60),
      size,
      colorName: color.name,
      colorSwatchHex: color.hex,
      priceMinor: basePrice + si * 1000,
      compareAtPriceMinor: index % 5 === 0 ? basePrice + 50000 : undefined,
      stock: fulfillment === 'ready_stock' ? 5 + ((index + si + ci) % 20) : 0,
      images: [],
    })),
  );

  const now = new Date(Date.now() - index * 60_000);

  return {
    slug: `${slugify(title)}-${index}`,
    title,
    description:
      'Sample product seeded for development and demo purposes. Heavyweight cotton, garment-dyed, boxy fit — replace with real copy and photography before launch.',
    status: 'published',
    categoryIds: categoryId ? [categoryId] : [],
    collectionIds: collectionIds.length ? [collectionIds[index % collectionIds.length]] : [],
    tags: [TAGS[index % TAGS.length]],
    audience,
    images,
    fabric: '240 GSM cotton fleece',
    fit: 'Oversized, boxy',
    careInstructions: 'Machine wash cold, inside out. Do not bleach.',
    featured: index % 9 === 0,
    fulfillment,
    productionLeadTimeDays: fulfillment === 'made_to_order' ? 10 : undefined,
    variants,
    salesCount: Math.max(0, 50 - index) % 40,
    createdAt: now,
    updatedAt: now,
  };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  const dbName = process.env.MONGODB_DB_NAME ?? 'vybe';
  const flags = parseFlags(process.argv.slice(2));
  const count = Number(flags.count ?? 48);
  const reset = Boolean(flags.reset);

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db(dbName);
    const productsCol = db.collection<Product>('products');
    const categoriesCol = db.collection<Category>('categories');
    const collectionsCol = db.collection<ProductCollection>('collections');
    const couponsCol = db.collection<Coupon>('coupons');
    const settingsCol = db.collection<StoreSettings>('store_settings');

    const existingProducts = await productsCol.countDocuments();
    if (existingProducts > 0 && !reset) {
      console.error(
        `Refusing to seed: ${existingProducts} product(s) already exist. Pass --reset to drop and reseed the catalog (orders/customers/staff are never touched).`,
      );
      process.exitCode = 1;
      return;
    }

    if (reset) {
      await Promise.all([
        productsCol.deleteMany({}),
        categoriesCol.deleteMany({}),
        collectionsCol.deleteMany({}),
        couponsCol.deleteMany({}),
        settingsCol.deleteMany({}),
      ]);
      console.log('Cleared products, categories, collections, coupons, store_settings.');
    }

    const now = new Date();
    const categoryIds = new Map<string, ObjectId>();
    let order = 0;
    for (const top of CATEGORY_TREE) {
      const topResult = await categoriesCol.insertOne({
        slug: top.slug,
        name: top.name,
        parentId: null,
        order: order++,
        createdAt: now,
        updatedAt: now,
      } as Category);
      categoryIds.set(top.slug, topResult.insertedId);

      let childOrder = 0;
      for (const child of top.children) {
        const childResult = await categoriesCol.insertOne({
          slug: child.slug,
          name: child.name,
          parentId: topResult.insertedId,
          order: childOrder++,
          createdAt: now,
          updatedAt: now,
        } as Category);
        categoryIds.set(child.slug, childResult.insertedId);
      }
    }
    console.log(`Seeded ${categoryIds.size} categories.`);

    const collectionIds: ObjectId[] = [];
    for (const c of COLLECTIONS) {
      const result = await collectionsCol.insertOne({
        slug: c.slug,
        name: c.name,
        description: c.description,
        bannerImageUrl: img(DEMO_IMAGES[collectionIds.length % DEMO_IMAGES.length], c.name).url,
        isActive: true,
        startsAt: now,
        createdAt: now,
        updatedAt: now,
      } as ProductCollection);
      collectionIds.push(result.insertedId);
    }
    console.log(`Seeded ${collectionIds.length} collections.`);

    const BATCH_SIZE = 500;
    let inserted = 0;
    let batch: Omit<Product, '_id'>[] = [];
    for (let i = 0; i < count; i++) {
      batch.push(buildProduct(i, categoryIds, collectionIds));
      if (batch.length >= BATCH_SIZE || i === count - 1) {
        await productsCol.insertMany(batch as Product[]);
        inserted += batch.length;
        batch = [];
        if (count > BATCH_SIZE) console.log(`  ...${inserted}/${count} products`);
      }
    }
    console.log(`Seeded ${inserted} products.`);

    await couponsCol.insertMany([
      {
        code: 'WELCOME10',
        type: 'percent',
        value: 10,
        usageLimit: 1000,
        perCustomerLimit: 1,
        usageCount: 0,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        code: 'FLAT500',
        type: 'fixed',
        value: 50000,
        minSpendMinor: 300000,
        usageCount: 0,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ] as Coupon[]);
    console.log('Seeded 2 demo coupons: WELCOME10, FLAT500.');

    await settingsCol.insertOne({
      storeName: 'VybeTheBrand',
      contactPhoneE164: '+923001234567',
      contactEmail: 'hello@vybethebrand.pk',
      whatsappSupportNumberE164: '+923001234567',
      socialLinks: [
        { platform: 'instagram', url: 'https://instagram.com/vybethebrand' },
        { platform: 'tiktok', url: 'https://tiktok.com/@vybethebrand' },
      ],
      shippingZones: [
        { name: 'Karachi', cities: ['Karachi'], feeMinor: 15000, codEligible: true },
        { name: 'Lahore/Islamabad', cities: ['Lahore', 'Islamabad', 'Rawalpindi'], feeMinor: 20000, codEligible: true },
      ],
      freeShippingThresholdMinor: 500000,
      defaultShippingFeeMinor: 25000,
      bankTransferInstructions: 'Transfer to Meezan Bank, Account Title: VybeTheBrand, Account #: 0000-0000-0000. Upload your receipt after checkout.',
      updatedAt: now,
    } as StoreSettings);
    console.log('Seeded store settings.');

    console.log('\nDone. Run `npm run provision:admin` next to create your admin login.');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
