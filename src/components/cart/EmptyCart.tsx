import { LinkButton } from '@/components/ui/Button';

export function EmptyCart() {
  return (
    <div className="flex flex-col items-center gap-5 border border-dashed border-ink/20 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink/5 text-2xl" aria-hidden="true">
        🛍️
      </div>
      <div>
        <p className="font-display text-xl uppercase tracking-widest2 text-ink">Your cart is empty</p>
        <p className="mt-2 text-sm text-ink-600">Looks like you haven&apos;t added anything yet.</p>
      </div>
      <LinkButton href="/shop" variant="primary" size="md">
        Start Shopping
      </LinkButton>
    </div>
  );
}
