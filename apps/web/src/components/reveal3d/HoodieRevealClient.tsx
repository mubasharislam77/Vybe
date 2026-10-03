'use client';

import dynamic from 'next/dynamic';

const HoodieReveal = dynamic(() => import('./HoodieReveal'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-ink-950">
      <span className="animate-pulse font-display text-sm tracking-[0.4em] text-vybe">
        LOADING THE DETAILS…
      </span>
    </div>
  ),
});

export default function HoodieRevealClient() {
  return <HoodieReveal />;
}
