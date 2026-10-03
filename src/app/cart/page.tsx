import type { Metadata } from 'next';
import { CartPageClient } from '@/components/cart/CartPageClient';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = { title: 'Your Cart' };

export default function CartPage() {
  return (
    <Container className="py-10 lg:py-16">
      <h1 className="mb-8 font-display text-4xl uppercase tracking-tight text-ink">Your Cart</h1>
      <CartPageClient />
    </Container>
  );
}
