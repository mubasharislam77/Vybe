import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { ScrollSpin } from '@/components/ui/ScrollMotion';
import { RingShape } from '@/components/ui/Shapes';
import type { CategoryNavNode } from '@/lib/services/catalog.service';

const IMAGE_BY_SLUG: Record<string, string> = {
  hoodies: '/products/hoodie-02.jpg',
  sweatshirts: '/products/street-02.jpg',
  't-shirts': '/products/tee-01.jpg',
  'oversized-tees': '/products/tee-02.jpg',
  'full-sleeve-tees': '/products/tee-03.jpg',
};
const FALLBACK_IMAGES = ['/products/street-01.jpg', '/products/street-03.jpg', '/products/hoodie-03.jpg'];

export function FeaturedCategories({ categories }: { categories: CategoryNavNode[] }) {
  const flat = categories.flatMap((c) => (c.children.length ? c.children : [{ slug: c.slug, name: c.name }]));
  if (flat.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <ScrollSpin factor={-0.05} className="absolute -left-20 top-1/2 z-0 hidden -translate-y-1/2 lg:block">
        <RingShape size={220} color="burgundy" opacity={0.08} />
      </ScrollSpin>
      <Container className="relative">
        <h2 className="mb-8 font-display text-2xl uppercase tracking-widest2 text-ink sm:text-3xl">Shop by Category</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {flat.slice(0, 5).map((cat, i) => (
            <Link key={cat.slug} href={`/category/${cat.slug}`} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden bg-ink/5">
                <Image
                  src={IMAGE_BY_SLUG[cat.slug] ?? FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 20vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </div>
              <p className="mt-3 text-sm text-ink">{cat.name}</p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
