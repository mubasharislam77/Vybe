'use client';

import { motion, useTransform, useReducedMotion } from 'framer-motion';
import { useAmbientScrollY } from '@/components/ui/AmbientScrollProvider';

/**
 * A horizontal text band that only moves in response to scroll — not a
 * "constant marquee" (perpetual auto-loop regardless of interaction, which
 * the brand brief explicitly rules out).
 *
 * Two identical copies of the (repeated-enough-to-exceed-viewport-width)
 * text sit side by side, sized to their own content (no forced width —
 * forcing a fixed box narrower than the text was what caused the two
 * copies to overlap/collide previously). Shifting the row by -50% of its
 * OWN width (a CSS percentage on transform is relative to the element's
 * own box) always moves it by exactly one copy's width, however wide that
 * actually renders, so the loop is seamless regardless of text/viewport size.
 */
export function ScrollMarqueeBand({ text, tone = 'ink' }: { text: string; tone?: 'ink' | 'lime' }) {
  const scrollY = useAmbientScrollY();
  const reduceMotion = useReducedMotion();
  const x = useTransform(scrollY, (v) => `${-((v * 0.04) % 50)}%`);

  const bg = tone === 'ink' ? 'bg-ink text-ivory' : 'bg-lime text-ink';
  const words = Array.from({ length: 4 }, () => text).join(' • ') + ' • ';

  return (
    <div className={`overflow-hidden border-y border-ink/10 py-4 ${bg}`} aria-hidden="true">
      <motion.div className="flex w-max whitespace-nowrap" style={reduceMotion ? undefined : { x }}>
        <span className="shrink-0 font-display text-2xl uppercase tracking-tight sm:text-4xl">{words}</span>
        <span className="shrink-0 font-display text-2xl uppercase tracking-tight sm:text-4xl">{words}</span>
      </motion.div>
    </div>
  );
}
