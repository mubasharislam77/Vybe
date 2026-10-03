'use client';

import { motion, useTransform, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useAmbientScrollY } from './AmbientScrollProvider';

/**
 * Decorative, scroll-linked background motion — tracks whole-page scroll
 * via the single shared listener in AmbientScrollProvider (not its own),
 * so each shape keeps drifting/spinning continuously as the user moves
 * through the page rather than resetting per section. Purely decorative:
 * aria-hidden, pointer-events-none, and inert entirely under
 * prefers-reduced-motion (the transform is dropped, not just slowed).
 */

export function ScrollSpin({
  className,
  factor = 0.06,
  children,
}: {
  className?: string;
  factor?: number;
  children: ReactNode;
}) {
  const scrollY = useAmbientScrollY();
  const reduceMotion = useReducedMotion();
  const rotate = useTransform(scrollY, (v) => v * factor);

  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none select-none ${className ?? ''}`}
      style={reduceMotion ? undefined : { rotate }}
    >
      {children}
    </motion.div>
  );
}

export function ScrollDrift({
  className,
  factor = 0.12,
  axis = 'y',
  children,
}: {
  className?: string;
  factor?: number;
  axis?: 'x' | 'y';
  children: ReactNode;
}) {
  const scrollY = useAmbientScrollY();
  const reduceMotion = useReducedMotion();
  const offset = useTransform(scrollY, (v) => v * factor);

  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none select-none ${className ?? ''}`}
      style={reduceMotion ? undefined : axis === 'x' ? { x: offset } : { y: offset }}
    >
      {children}
    </motion.div>
  );
}
