import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { ProductCard, type ProductCardData } from '@/components/ui/ProductCard';
import { RevealOnScroll } from '@/components/ui/ScrollReveal';

export function ProductRail({
  title,
  description,
  viewAllHref,
  products,
}: {
  title: string;
  description?: string;
  viewAllHref: string;
  products: ProductCardData[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl uppercase tracking-widest2 text-ink sm:text-3xl">{title}</h2>
            {description && <p className="mt-2 max-w-md text-sm text-ink-600">{description}</p>}
          </div>
          <Link href={viewAllHref} className="hidden shrink-0 text-sm underline-offset-4 hover:underline sm:block">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {products.slice(0, 8).map((p, i) => (
            <RevealOnScroll key={p.slug} delay={(i % 4) * 0.07} y={36} scale={0.95}>
              <ProductCard product={p} />
            </RevealOnScroll>
          ))}
        </div>

        <Link href={viewAllHref} className="mt-8 block text-sm underline-offset-4 hover:underline sm:hidden">
          View all →
        </Link>
      </Container>
    </section>
  );
}
