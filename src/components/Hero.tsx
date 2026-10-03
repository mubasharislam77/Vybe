'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useTransform, useReducedMotion } from 'framer-motion';
import { ScrollSpin, ScrollDrift } from '@/components/ui/ScrollMotion';
import { RingShape, DiamondShape } from '@/components/ui/Shapes';
import { useLocalScrollProgress } from '@/components/ui/ScrollParallax';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (delay: number) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const } }),
};

const QUICK_CATEGORIES = [
  { label: 'Hoodies', href: '/category/hoodies' },
  { label: 'Tees', href: '/category/t-shirts' },
  { label: 'Sweatshirts', href: '/category/sweatshirts' },
];

const SIDE_TAGS = [
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'Best Sellers', href: '/best-sellers' },
  { label: 'Sale', href: '/sale' },
  { label: 'Shop All', href: '/shop' },
];

export default function Hero() {
  const { ref, scrollYProgress } = useLocalScrollProgress<HTMLElement>(['start start', 'end start']);
  const reduceMotion = useReducedMotion();

  const imageY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 1, 0]);

  return (
    <section ref={ref} id="hero" className="relative overflow-hidden bg-ivory">
      {/* decorative, scroll-linked background shapes — aria-hidden, inert under reduced motion */}
      <ScrollSpin factor={0.06} className="absolute -left-20 top-10 z-0 hidden lg:block">
        <RingShape size={220} color="burgundy" opacity={0.1} />
      </ScrollSpin>
      <ScrollDrift factor={-0.12} axis="y" className="absolute left-[6%] top-[80%] z-0">
        <DiamondShape size={18} color="burgundy" opacity={0.4} />
      </ScrollDrift>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center lg:grid-cols-12">
        {/* Left: copy */}
        <motion.div
          style={reduceMotion ? undefined : { y: textY, opacity: textOpacity }}
          className="relative z-10 flex flex-col justify-center px-4 py-14 sm:px-6 lg:col-span-6 lg:px-8 lg:py-20"
        >
          <motion.p
            initial="hidden"
            animate="show"
            custom={0}
            variants={fadeUp}
            className="mb-4 font-display text-xs uppercase tracking-widest2 text-burgundy"
          >
            Designed for the culture
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            custom={0.1}
            variants={fadeUp}
            className="relative flex items-start"
          >
            <h1 className="font-display text-[20vw] leading-[0.82] tracking-tight text-ink sm:text-8xl lg:text-7xl xl:text-8xl">
              VYBE
            </h1>
            <span
              aria-hidden="true"
              className="pointer-events-none select-none font-display text-[22vw] leading-none text-ink/10 sm:text-9xl lg:text-8xl xl:text-9xl"
            >
              01
            </span>
          </motion.div>

          <motion.p
            initial="hidden"
            animate="show"
            custom={0.2}
            variants={fadeUp}
            className="mt-5 max-w-md text-base text-ink-600 sm:text-lg"
          >
            Desi roots, global vibe. Oversized tees, hoodies, and sweatshirts built for the culture —
            heavyweight fabric, bold graphics, zero compromise.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            custom={0.3}
            variants={fadeUp}
            className="mt-7 flex flex-wrap gap-2"
          >
            {QUICK_CATEGORIES.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="min-h-[40px] border border-ink/20 px-4 py-2 text-xs uppercase tracking-widest2 text-ink transition-colors hover:border-ink hover:bg-ink hover:text-ivory"
              >
                {c.label}
              </Link>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            custom={0.4}
            variants={fadeUp}
            className="mt-9 flex flex-wrap items-center gap-5"
          >
            <Link
              href="/new-arrivals"
              className="inline-flex min-h-[44px] items-center justify-center bg-ink px-8 py-4 font-display text-sm uppercase tracking-widest2 text-ivory transition-colors hover:bg-lime hover:text-ink"
            >
              Shop New Arrivals
            </Link>
            <Link href="/shop" className="group inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/30 text-ink transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-ivory">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M4 2.5v11l10-5.5-10-5.5Z" />
                </svg>
              </span>
              <span className="font-display text-xs uppercase tracking-widest2 text-ink">Watch Lookbook</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Right: color block + model cutout */}
        <div className="relative col-span-1 h-[62vh] px-4 pb-10 sm:px-6 lg:col-span-6 lg:h-[82vh] lg:px-8 lg:pb-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-4 z-0 rounded-[2.5rem] bg-lime sm:inset-6"
            aria-hidden="true"
          />

          {/* category tag list on the color block */}
          <div className="absolute right-10 top-10 z-10 hidden flex-col items-end gap-3 sm:flex lg:right-14 lg:top-14">
            {SIDE_TAGS.map((tag) => (
              <Link
                key={tag.href}
                href={tag.href}
                className="font-display text-sm uppercase tracking-tight text-ink/70 transition-colors hover:text-ink"
              >
                {tag.label}
              </Link>
            ))}
          </div>

          <motion.div
            style={reduceMotion ? undefined : { y: imageY }}
            className="absolute inset-x-0 bottom-0 z-10 h-full will-change-transform"
          >
            <Image
              src="/hero.png"
              alt="VybeTheBrand model wearing the latest drop"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain object-bottom"
            />
          </motion.div>

          <div className="absolute bottom-2 left-8 z-10 font-display text-[10px] uppercase tracking-widest2 text-ink/40 sm:left-12">
            Sample photography — replace before launch
          </div>

          {/* scroll cue */}
          <div className="absolute bottom-6 right-6 z-10 hidden flex-col gap-2 lg:flex">
            <a
              href="#next-section"
              aria-label="Scroll to next section"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 bg-ivory text-ink transition-colors hover:border-ink"
            >
              ↓
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
