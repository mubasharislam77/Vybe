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

export default function Hero() {
  const { ref, scrollYProgress } = useLocalScrollProgress<HTMLElement>(['start start', 'end start']);
  const reduceMotion = useReducedMotion();

  // As the hero scrolls out of view: the photo drifts up slower than the
  // page (parallax) and zooms in slightly; the text column fades/rises
  // out faster, so it clears the viewport before the image does.
  const imageY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 1, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-ink">
      {/* thin multi-tone accent bar — the only "gradient-adjacent" move on the page, kept to a hairline */}
      <div className="flex h-1.5 w-full">
        <span className="flex-1 bg-lime" />
        <span className="flex-1 bg-burgundy" />
        <span className="flex-1 bg-ivory" />
      </div>

      {/* decorative, scroll-linked background shapes — aria-hidden, inert under reduced motion */}
      <ScrollSpin factor={0.08} className="absolute -right-24 -top-24 z-0 hidden lg:block">
        <RingShape size={340} color="lime" opacity={0.12} />
      </ScrollSpin>
      <ScrollDrift factor={-0.15} axis="y" className="absolute left-[8%] top-[65%] z-0">
        <DiamondShape size={22} color="burgundy" opacity={0.5} />
      </ScrollDrift>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-12">
        <motion.div
          style={reduceMotion ? undefined : { y: textY, opacity: textOpacity }}
          className="relative z-10 flex flex-col justify-center px-4 py-16 sm:px-6 lg:col-span-6 lg:px-8 lg:py-28"
        >
          <motion.span
            initial="hidden"
            animate="show"
            custom={0}
            variants={fadeUp}
            className="mb-5 inline-flex w-fit items-center gap-2 bg-burgundy px-3 py-1.5 font-display text-xs uppercase tracking-widest2 text-ivory"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden="true" />
            Pakistan&apos;s streetwear, elevated
          </motion.span>

          <motion.h1
            initial="hidden"
            animate="show"
            custom={0.1}
            variants={fadeUp}
            className="font-display text-[18vw] leading-[0.85] tracking-tight text-lime sm:text-[9rem] lg:text-[7rem] xl:text-[8rem]"
          >
            VYBE
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            custom={0.2}
            variants={fadeUp}
            className="mt-6 max-w-md text-base text-ivory/70 sm:text-lg"
          >
            Desi roots, global vibe. Oversized tees, hoodies, and sweatshirts built for the culture —
            heavyweight fabric, bold graphics, zero compromise.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            custom={0.3}
            variants={fadeUp}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/new-arrivals"
              className="inline-flex min-h-[44px] items-center justify-center bg-lime px-8 py-4 font-display text-sm uppercase tracking-widest2 text-ink transition-colors hover:bg-ivory"
            >
              Shop New Arrivals
            </Link>
            <Link
              href="/shop"
              className="inline-flex min-h-[44px] items-center justify-center border border-ivory/30 px-8 py-4 font-display text-sm uppercase tracking-widest2 text-ivory transition-colors hover:border-lime hover:text-lime"
            >
              Shop All
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative col-span-1 h-[60vh] overflow-hidden lg:col-span-6 lg:h-auto"
        >
          <motion.div
            style={reduceMotion ? undefined : { y: imageY, scale: imageScale }}
            className="absolute inset-0 will-change-transform"
          >
            <Image
              src="/products/hoodie-01.jpg"
              alt="Model wearing a VybeTheBrand back-print hoodie"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </motion.div>
          {/* burgundy corner block — asymmetric accent, not a gradient */}
          <div className="absolute right-0 top-0 h-20 w-20 bg-burgundy sm:h-28 sm:w-28" aria-hidden="true" />
          <div className="absolute right-4 top-4 font-display text-xs uppercase tracking-widest2 text-ivory sm:right-6 sm:top-6">
            New
            <br />
            Drop
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-ink/85 px-4 py-3 text-xs uppercase tracking-widest2 text-lime backdrop-blur-sm sm:px-6">
            Sample product &amp; photography — replace before launch
          </div>
        </motion.div>
      </div>
    </section>
  );
}
