import type { Metadata } from 'next';
import { CartPageClient } from '@/components/cart/CartPageClient';
import { Container } from '@/components/ui/Container';
import { listFeatured } from '@/lib/repositories/products.repo';
import { productToCardData } from '@/lib/services/catalog.service';

export const metadata: Metadata = { title: 'Your Cart' };

export default async function CartPage() {
  const featured = await listFeatured(8);
  const crossSell = featured.map(productToCardData);

  return (
    <div className="bg-ivory">
      <Container className="py-10 lg:py-16">
        <CartPageClient crossSell={crossSell} />
      </Container>
    </div>
  );
}
