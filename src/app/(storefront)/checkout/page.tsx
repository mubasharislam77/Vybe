import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false, follow: false } };

// Explicitly dynamic, not because it touches the DB today (it doesn't —
// cart contents are client-side), but because checkout must never be
// cached or served as static content, per the spec's explicit "never
// share-cache private accounts, carts, checkout, or admin data." Safer
// to state that outright than rely on Next's static/dynamic heuristic
// continuing to land the same way as the page evolves.
export const dynamic = 'force-dynamic';

const STEPS = [
  { label: 'Cart', href: '/cart', done: true },
  { label: 'Checkout', href: null, done: false },
  { label: 'Confirmation', href: null, done: false },
];

export default function CheckoutPage() {
  return (
    <Container className="py-10 lg:py-16">
      <nav aria-label="Checkout progress" className="mb-8 flex items-center gap-2 text-xs">
        {STEPS.map((step, i) => (
          <span key={step.label} className="flex items-center gap-2">
            {i > 0 && <span className="text-ink/20">—</span>}
            {step.href ? (
              <Link href={step.href} className="flex items-center gap-1.5 text-ink-400 hover:text-ink">
                {step.done && <span className="text-lime">✓</span>}
                {step.label}
              </Link>
            ) : (
              <span className={`flex items-center gap-1.5 ${i === 1 ? 'font-medium text-ink' : 'text-ink-400'}`}>
                {step.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      <h1 className="mb-8 font-display text-4xl uppercase tracking-tight text-ink sm:text-5xl">Checkout</h1>
      <CheckoutForm />
    </Container>
  );
}
