'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useScroll, type MotionValue } from 'framer-motion';

const AmbientScrollContext = createContext<MotionValue<number> | null>(null);

/**
 * One single window-scroll subscription for every decorative ambient
 * shape on the page, instead of each ScrollSpin/ScrollDrift instance
 * creating its own. With half a dozen decorative shapes on the homepage,
 * that was six independent scroll listeners/useTransform chains doing
 * near-identical work every frame — the main contributor to the scroll
 * jank reported after the first pass of this feature.
 */
export function AmbientScrollProvider({ children }: { children: ReactNode }) {
  const { scrollY } = useScroll();
  return <AmbientScrollContext.Provider value={scrollY}>{children}</AmbientScrollContext.Provider>;
}

export function useAmbientScrollY(): MotionValue<number> {
  const ctx = useContext(AmbientScrollContext);
  if (!ctx) throw new Error('useAmbientScrollY must be used within an AmbientScrollProvider');
  return ctx;
}
