'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
    >
      {/* ambient accent glows */}
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-vybe/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-1/4 h-96 w-96 rounded-full bg-vybe-hot/10 blur-[120px]" />

      {/* Urdu-accent watermark */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]"
        aria-hidden
      >
        <span className="font-display text-[28vw] leading-none text-chalk">وائب</span>
      </div>

      <div className="relative z-10 text-center">
        {/* Animated logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-6 w-28 md:w-36"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Image
              src="/vybe-logo.png"
              alt="VYBE"
              width={160}
              height={160}
              priority
              className="mx-auto h-auto w-full drop-shadow-[0_0_40px_rgba(212,255,63,0.25)]"
            />
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4 font-display text-xs tracking-[0.5em] text-vybe md:text-sm"
        >
          PAKISTAN&apos;S STREETWEAR, ELEVATED
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[22vw] leading-[0.82] tracking-tighter text-chalk md:text-[16rem]"
        >
          VYBE
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-6 max-w-md text-base text-chalk/70 md:text-lg"
        >
          Desi roots. Global vibe. Premium heavyweight hoodies, sweatshirts & tees —
          built for the culture, cut for the world.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="#reveal"
            className="group relative overflow-hidden bg-vybe px-8 py-4 font-display text-sm uppercase tracking-widest text-ink-950 transition-transform hover:scale-[1.03]"
          >
            Enter the Vibe
          </a>
          <a
            href="#drop"
            className="px-8 py-4 font-display text-sm uppercase tracking-widest text-chalk/80 underline-offset-8 transition-colors hover:text-vybe hover:underline"
          >
            See the Drop
          </a>
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-chalk/40">
            Scroll
          </span>
          <motion.span
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="block h-8 w-px bg-gradient-to-b from-vybe to-transparent"
          />
        </div>
      </motion.div>
    </section>
  );
}
