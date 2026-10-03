import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findOrderByTrackingToken } from '@/lib/repositories/orders.repo';
import { getStoreSettings } from '@/lib/repositories/settings.repo';
import { OrderStatusView } from '@/components/order/OrderStatusView';
import { Container } from '@/components/ui/Container';
import { LinkButton } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Order Confirmed', robots: { index: false, follow: false } };

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; token?: string }>;
}) {
  const { order: orderNumber, token } = await searchParams;
  if (!orderNumber || !token) notFound();

  const order = await findOrderByTrackingToken(orderNumber, token);
  if (!order) notFound();

  const settings = await getStoreSettings();

  return (
    <Container className="max-w-2xl py-10 lg:py-16">
      <div className="mb-10 text-center">
        <p className="mb-2 font-display text-xs uppercase tracking-widest2 text-lime">Thank you</p>
        <h1 className="font-display text-3xl uppercase tracking-tight text-ink sm:text-4xl">
          Your order is confirmed
        </h1>
        <p className="mt-3 text-sm text-ink-600">
          We&apos;ll text you on {order.shipping.phoneE164} with updates.
        </p>
      </div>

      <OrderStatusView order={order} bankInstructions={settings.bankTransferInstructions} />

      <div className="mt-10 flex justify-center">
        <LinkButton href="/shop" variant="secondary" size="md">
          Continue Shopping
        </LinkButton>
      </div>
    </Container>
  );
}
