import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findOrderByTrackingToken } from '@/lib/repositories/orders.repo';
import { getStoreSettings } from '@/lib/repositories/settings.repo';
import { OrderStatusView } from '@/components/order/OrderStatusView';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = { title: 'Track Order', robots: { index: false, follow: false } };

export default async function TrackOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { orderNumber } = await params;
  const { token } = await searchParams;
  if (!token) notFound();

  const order = await findOrderByTrackingToken(orderNumber, token);
  if (!order) notFound();

  const settings = await getStoreSettings();

  return (
    <Container className="max-w-2xl py-10 lg:py-16">
      <OrderStatusView order={order} bankInstructions={settings.bankTransferInstructions} />
    </Container>
  );
}
