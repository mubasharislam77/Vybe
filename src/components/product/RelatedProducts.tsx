import { getRelatedProducts } from '@/lib/repositories/products.repo';
import type { Product } from '@/types/domain';
import { ProductCard } from '@/components/ui/ProductCard';
import { Container } from '@/components/ui/Container';
import { productToCardData } from '@/lib/services/catalog.service';

export async function RelatedProducts({ product }: { product: Product }) {
  const related = await getRelatedProducts(product, 4);
  if (related.length === 0) return null;

  return (
    <section className="border-t border-ink/10 py-16">
      <Container>
        <h2 className="mb-8 font-display text-2xl uppercase tracking-widest2 text-ink">You May Also Like</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.slug} product={productToCardData(p)} />
          ))}
        </div>
      </Container>
    </section>
  );
}
