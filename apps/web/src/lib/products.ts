export type Product = {
  id: string;
  name: string;
  category: 'Hoodie' | 'Sweatshirt' | 'T-Shirt';
  pricePKR: number;
  tag?: string;
  // product photo (swap in /public/products for your own shots)
  image: string;
  // fallback gradient colors if the image is missing
  swatch: [string, string];
};

/** Fallback catalog — mirrors the shape returned by the Nest API. */
export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'vybe-heavy-hoodie-charcoal',
    name: 'Heavyweight Hoodie — Charcoal',
    category: 'Hoodie',
    pricePKR: 6900,
    tag: 'Bestseller',
    image: '/products/hoodie-02.jpg',
    swatch: ['#2a2a30', '#0d0d10'],
  },
  {
    id: 'vybe-crew-lime',
    name: 'Loop-Knit Crewneck — Lime Hit',
    category: 'Sweatshirt',
    pricePKR: 5400,
    tag: 'New',
    image: '/products/street-03.jpg',
    swatch: ['#d4ff3f', '#4a5a12'],
  },
  {
    id: 'vybe-boxy-tee-bone',
    name: 'Boxy Heavy Tee — Bone',
    category: 'T-Shirt',
    pricePKR: 2900,
    image: '/products/tee-03.jpg',
    swatch: ['#f4f4f0', '#b8b3a6'],
  },
  {
    id: 'vybe-zip-hoodie-hot',
    name: 'Back-Print Hoodie — Coastal',
    category: 'Hoodie',
    pricePKR: 7400,
    tag: 'Limited',
    image: '/products/hoodie-01.jpg',
    swatch: ['#ff3d68', '#5a1226'],
  },
];

export const formatPKR = (n: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(n);
