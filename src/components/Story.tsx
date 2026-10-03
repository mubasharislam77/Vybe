'use client';

import Reveal from './ui/Reveal';

const STATS = [
  { value: '380', label: 'GSM heavyweight fleece' },
  { value: '100%', label: 'Cotton, ethically sourced' },
  { value: 'PK', label: 'Designed & printed locally' },
];

export default function Story() {
  return (
    <section id="story" className="relative overflow-hidden bg-ink-900 px-6 py-24 md:py-32">
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-[0.04]"
        aria-hidden
      >
        <span className="font-display text-[20vw] leading-none text-chalk">تارکا</span>
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <Reveal>
          <p className="font-display text-xs tracking-[0.4em] text-vybe">THE VYBE STORY</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-5 font-display text-3xl leading-tight text-chalk md:text-5xl">
            Desi roots. Western tarka.
            <br />
            <span className="text-stroke">One unmistakable vibe.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-chalk/60 md:text-lg">
            VYBE was born on the streets of Pakistan and cut for the world. We take the
            energy of desi culture — the colour, the confidence, the chaos — and give it a
            clean, western silhouette. Heavyweight fabric, honest construction, graphics
            that mean something. This isn&apos;t fast fashion. It&apos;s a vibe you
            wear.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={0.1 * i}>
              <div className="border-t border-white/10 pt-6">
                <p className="font-display text-4xl text-vybe md:text-5xl">{s.value}</p>
                <p className="mt-2 text-sm text-chalk/50">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
