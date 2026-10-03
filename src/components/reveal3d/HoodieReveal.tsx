'use client';

import { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useScroll, useMotionValueEvent } from 'framer-motion';
import HoodieScene, { DETAILS } from './HoodieScene';

export default function HoodieReveal() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [index, setIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    progress.current = v;
    setIndex(Math.round(v * (DETAILS.length - 1)));
  });

  return (
    <section ref={wrapRef} className="relative h-[600vh] bg-ink-950" id="hoodie">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* heading */}
        <div className="pointer-events-none absolute left-0 top-0 z-20 w-full px-6 pt-8 md:px-16 md:pt-12">
          <p className="font-display text-xs tracking-[0.4em] text-vybe md:text-sm">
            THE HOODIE — IN DETAIL
          </p>
          <h2 className="mt-2 font-display text-2xl leading-none text-chalk/90 md:text-4xl">
            Made to be inspected.
          </h2>
        </div>

        {/* 3D detail reveal */}
        <div className="absolute inset-0">
          <Canvas
            camera={{ position: [0, 0.25, 4.6], fov: 42, near: 0.05, far: 60 }}
            gl={{ antialias: true, alpha: false }}
            dpr={[1, 2]}
          >
            <color attach="background" args={['#08080a']} />
            <Suspense fallback={null}>
              <HoodieScene progress={progress} activeIndex={index} />
            </Suspense>
          </Canvas>
        </div>

        {/* vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(115% 90% at 50% 45%, transparent 50%, rgba(0,0,0,0.5) 100%)',
          }}
        />

        {/* detail progress dots */}
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {DETAILS.map((d, i) => (
            <span
              key={d.label}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === index ? 'w-8 bg-vybe' : 'w-4 bg-white/20'
              }`}
              aria-hidden
            />
          ))}
        </div>

        {index === 0 && (
          <div className="pointer-events-none absolute bottom-8 right-6 z-20 md:right-16">
            <span className="font-display text-[10px] uppercase tracking-[0.3em] text-chalk/40">
              Scroll to zoom in ↓
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
