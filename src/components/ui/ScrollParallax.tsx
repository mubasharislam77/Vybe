'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from 'framer-motion';

type ScrollOffset = NonNullable<Parameters<typeof useScroll>[0]>['offset'];

/**
 * Continuous scroll-scrubbed transform, tied to how far THIS element has
 * moved through the viewport (not global page scroll) — the value tracks
 * scroll position directly, live, including scrolling back up, which is
 * what actually reads as "immersive" rather than a one-shot entrance.
 *
 * Default offset (`['start end', 'end start']`) gives 0 as the element
 * first enters the viewport bottom and 1 as it exits the top — right for
 * a "reveal while scrolling through" section. Pass `['start start', 'end
 * start']` instead for a "pin and parallax while it owns the viewport"
 * section like the Hero, where 0 is page load and 1 is fully scrolled past.
 */
export function useLocalScrollProgress<T extends HTMLElement>(offset?: ScrollOffset) {
  const ref = useRef<T>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: offset ?? ['start end', 'end start'] });
  return { ref, scrollYProgress };
}

export function ParallaxLayer({
  progress,
  distance = 80,
  className = '',
  children,
}: {
  progress: MotionValue<number>;
  distance?: number;
  className?: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const y = useTransform(progress, [0, 1], [distance, -distance]);

  return (
    <motion.div className={className} style={reduceMotion ? undefined : { y }}>
      {children}
    </motion.div>
  );
}
