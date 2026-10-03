import { Container } from '@/components/ui/Container';
import { formatPKR } from '@/lib/utils/money';
import type { StoreSettings } from '@/types/domain';

const ITEMS = (settings: StoreSettings) => [
  {
    title: 'Cash on delivery',
    body: 'Pay when it arrives, in most cities across Pakistan.',
  },
  {
    title: settings.freeShippingThresholdMinor
      ? `Free shipping over ${formatPKR(settings.freeShippingThresholdMinor)}`
      : 'Nationwide shipping',
    body: 'Delivered in 3–6 business days depending on your city.',
  },
  {
    title: 'Easy returns',
    body: 'Didn’t fit? Exchange or return within 7 days of delivery.',
  },
  {
    title: 'WhatsApp support',
    body: 'Real answers from a real person, not a bot.',
  },
];

export function ShoppingInfo({ settings }: { settings: StoreSettings }) {
  return (
    <section className="border-y border-ink/10 py-12">
      <Container>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS(settings).map((item) => (
            <div key={item.title}>
              <p className="font-display text-sm uppercase tracking-widest2 text-ink">{item.title}</p>
              <p className="mt-2 text-sm text-ink-600">{item.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
