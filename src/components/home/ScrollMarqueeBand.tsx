'use client';

import { useReducedMotion } from 'framer-motion';

/**
 * A continuously auto-scrolling text band (CSS keyframe animation, runs on
 * the compositor thread — not tied to the scroll listener system at all).
 * Two identical copies sit side by side; the keyframe shifts by exactly
 * -50% of the row's own width, so with two equal copies the loop is
 * seamless regardless of how long the text renders. Paused entirely under
 * prefers-reduced-motion rather than just slowed.
 */
export function ScrollMarqueeBand({ text, tone = 'ink' }: { text: string; tone?: 'ink' | 'lime' }) {
  const reduceMotion = useReducedMotion();
  const bg = tone === 'ink' ? 'bg-ink text-ivory' : 'bg-lime text-ink';
  const words = Array.from({ length: 4 }, () => text).join(' • ') + ' • ';

  return (
    <div id="next-section" className={`overflow-hidden border-y border-ink/10 py-4 ${bg}`} aria-hidden="true">
      <div className={`flex w-max whitespace-nowrap ${reduceMotion ? '' : 'animate-marquee'}`}>
        <span className="shrink-0 font-display text-2xl uppercase tracking-tight sm:text-4xl">{words}</span>
        <span className="shrink-0 font-display text-2xl uppercase tracking-tight sm:text-4xl">{words}</span>
      </div>
    </div>
  );
}
