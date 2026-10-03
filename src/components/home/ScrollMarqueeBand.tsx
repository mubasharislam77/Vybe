'use client';

import { motion, useTransform, useReducedMotion } from 'framer-motion';
import { useAmbientScrollY } from '@/components/ui/AmbientScrollProvider';

/**
 * A horizontal text band that only moves in response to scroll — not a
 * "constant marquee" (perpetual auto-loop regardless of interaction, which
 * the brand brief explicitly rules out). Two copies of the text sit
 * side by side in a double-width row; translateX is scroll position
 * modulo 50%, so it always loops seamlessly but is entirely scroll-driven.
 */
export function ScrollMarqueeBand({ text, tone = 'ink' }: { text: string; tone?: 'ink' | 'lime' }) {
  const scrollY = useAmbientScrollY();
  const reduceMotion = useReducedMotion();
  const x = useTransform(scrollY, (v) => `${-((v * 0.04) % 50)}%`);

  const bg = tone === 'ink' ? 'bg-ink text-ivory' : 'bg-lime text-ink';
  const words = Array.from({ length: 6 }, () => text).join(' • ');

  return (
    <div className={`overflow-hidden border-y border-ink/10 py-4 ${bg}`} aria-hidden="true">
      <motion.div
        className="flex w-[200%] shrink-0 whitespace-nowrap"
        style={reduceMotion ? undefined : { x }}
      >
        <span className="w-1/2 shrink-0 font-display text-2xl uppercase tracking-tight sm:text-4xl">{words}</span>
        <span className="w-1/2 shrink-0 font-display text-2xl uppercase tracking-tight sm:text-4xl">{words}</span>
      </motion.div>
    </div>
  );
}
