'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Triggers once as an element scrolls into view — a lighter-weight
 * alternative to continuous scroll-scrubbing (see ScrollParallax.tsx) for
 * grid/list sections where a per-element live scroll tie isn't worth the
 * render cost. Still genuinely scroll-reactive: nothing happens until the
 * element is ~15% into the viewport.
 */
export function RevealOnScroll({
  children,
  delay = 0,
  className = '',
  y = 28,
  scale = 1,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
  scale?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y, scale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Wraps a list of children, staggering each one's RevealOnScroll by index. */
export function StaggerReveal({
  children,
  className = '',
  stagger = 0.08,
}: {
  children: ReactNode[];
  className?: string;
  stagger?: number;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <RevealOnScroll key={i} delay={i * stagger}>
          {child}
        </RevealOnScroll>
      ))}
    </div>
  );
}
