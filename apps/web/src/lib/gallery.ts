export type GalleryItem = {
  src: string;
  label: string;
  category: 'Hoodie' | 'Sweatshirt' | 'Tee' | 'Streetwear';
};

/**
 * Garments that fly / float / revolve through the scroll scene.
 * These are premium PLACEHOLDER photos (Unsplash, free for commercial use).
 * Replace each file in /public/products with your own shots — same filename,
 * and the scene picks them up automatically.
 */
export const GALLERY: GalleryItem[] = [
  { src: '/products/hoodie-02.jpg', label: 'Heavyweight Hoodie', category: 'Hoodie' },
  { src: '/products/street-03.jpg', label: 'Neon Statement Set', category: 'Streetwear' },
  { src: '/products/hoodie-01.jpg', label: 'Back-Print Hoodie', category: 'Hoodie' },
  { src: '/products/tee-03.jpg', label: 'Graphic Heavy Tee', category: 'Tee' },
  { src: '/products/street-01.jpg', label: 'Street Layer', category: 'Streetwear' },
  { src: '/products/hoodie-03.jpg', label: 'Coastal Hoodie', category: 'Hoodie' },
  { src: '/products/tee-01.jpg', label: 'Essential Boxy Tee', category: 'Tee' },
  { src: '/products/tee-02.jpg', label: 'Blank Canvas Tee', category: 'Tee' },
  { src: '/products/street-02.jpg', label: 'In Motion', category: 'Streetwear' },
];

// Narrative captions that fade in across the scroll.
export const STAGES = [
  { at: 0.0, kicker: 'THE VYBE DROP', title: 'Worn by the culture.' },
  { at: 0.32, kicker: 'HEAVYWEIGHT', title: 'Hoodies that hit different.' },
  { at: 0.6, kicker: 'EVERYDAY ICONS', title: 'Tees, cut oversized.' },
  { at: 0.86, kicker: 'ONE VIBE', title: 'Desi roots. Global vibe.' },
];
