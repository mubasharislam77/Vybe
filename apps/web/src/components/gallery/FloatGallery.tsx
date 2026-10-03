'use client';

import { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import GarmentField from './GarmentField';
import { STAGES } from '@/lib/gallery';

export default function FloatGallery() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [stage, setStage] = useState(0);
  const [p, setP] = useState(0);

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    progress.current = v;
    setP(v);
    let s = 0;
    for (let i = 0; i < STAGES.length; i++) if (v >= STAGES[i].at) s = i;
    setStage(s);
  });

  const current = STAGES[stage];

  return (
    <section ref={wrapRef} className="relative h-[600vh] bg-ink-950" id="reveal">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* 3D fly-through */}
        <div className="absolute inset-0">
          <Canvas
            camera={{ position: [0, 0, 8], fov: 55, near: 0.1, far: 140 }}
            gl={{ antialias: true, alpha: false }}
            dpr={[1, 2]}
          >
            <color attach="background" args={['#08080a']} />
            <Suspense fallback={null}>
              <GarmentField progress={progress} />
            </Suspense>
          </Canvas>
        </div>

        {/* cinematic vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 90% at 50% 50%, transparent 45%, rgba(0,0,0,0.55) 100%)',
          }}
        />

        {/* kinetic caption */}
        <div className="pointer-events-none absolute inset-0 flex items-end">
          <div className="w-full px-6 pb-20 md:px-16 md:pb-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={stage}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="font-display text-xs tracking-[0.4em] text-vybe md:text-sm">
                  {current.kicker}
                </p>
                <h2 className="mt-2 max-w-2xl font-display text-4xl leading-[0.95] text-chalk md:text-7xl">
                  {current.title}
                </h2>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* progress rail */}
        <div className="absolute bottom-8 left-6 z-20 flex items-center gap-3 md:left-16">
          <span className="font-display text-xs text-chalk/40">
            {String(Math.round(p * 100)).padStart(2, '0')}
          </span>
          <div className="h-px w-40 bg-white/15">
            <div
              className="h-full bg-vybe transition-[width] duration-150"
              style={{ width: `${p * 100}%` }}
            />
          </div>
        </div>

        {/* scroll hint (only near the top) */}
        {p < 0.04 && (
          <div className="pointer-events-none absolute bottom-8 right-6 z-20 md:right-16">
            <span className="font-display text-[10px] uppercase tracking-[0.3em] text-chalk/40">
              Scroll to explore ↓
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
