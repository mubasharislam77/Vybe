import type { Metadata } from 'next';
import { TrackOrderForm } from '@/components/order/TrackOrderForm';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = { title: 'Track Order' };

export default function TrackOrderLandingPage() {
  return (
    <Container className="max-w-md py-10 lg:py-16">
      <h1 className="mb-3 font-display text-3xl uppercase tracking-tight text-ink">Track Your Order</h1>
      <p className="mb-8 text-sm text-ink-600">
        Enter your order number and the tracking code from your confirmation page.
      </p>
      <TrackOrderForm />
    </Container>
  );
}
