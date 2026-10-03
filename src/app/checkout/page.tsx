import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return (
    <Container className="py-10 lg:py-16">
      <h1 className="mb-8 font-display text-4xl uppercase tracking-tight text-ink">Checkout</h1>
      <CheckoutForm />
    </Container>
  );
}
