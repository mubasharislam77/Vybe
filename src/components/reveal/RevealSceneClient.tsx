'use client';

import dynamic from 'next/dynamic';

// R3F needs the browser (WebGL / window), so load it client-side only.
const RevealScene = dynamic(() => import('./RevealScene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-ink-950">
      <span className="animate-pulse font-display text-sm tracking-[0.4em] text-vybe">
        LOADING THE VIBE…
      </span>
    </div>
  ),
});

export default function RevealSceneClient() {
  return <RevealScene />;
}
