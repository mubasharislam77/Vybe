import { ProductCard, type ProductCardData } from '@/components/ui/ProductCard';
import { RevealOnScroll } from '@/components/ui/ScrollReveal';

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 border border-dashed border-ink/20 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink/5 text-xl" aria-hidden="true">
          🔍
        </div>
        <p className="font-display text-2xl uppercase tracking-widest2 text-ink">Nothing here yet</p>
        <p className="max-w-sm text-sm text-ink-400">
          Try clearing a filter or searching for something else — new drops land often.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <RevealOnScroll key={p.slug} delay={(i % 4) * 0.06} y={28} scale={0.96}>
          <ProductCard product={p} />
        </RevealOnScroll>
      ))}
    </div>
  );
}
