'use client';

import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Suspense } from 'react';
import Model from './Model';

type Marker = {
  id: string;
  range: [number, number]; // scroll progress window it is visible
  side: 'left' | 'right';
  // vertical anchor of the dot, as % from top of the sticky viewport
  top: string;
  dotX: string; // horizontal anchor of the dot
  kicker: string;
  title: string;
  detail: string;
};

const MARKERS: Marker[] = [
  {
    id: 'fit',
    range: [0.05, 0.2],
    side: 'right',
    top: '38%',
    dotX: '52%',
    kicker: '01 — Silhouette',
    title: 'Oversized drop-shoulder fit',
    detail: 'Boxy, street-ready cut. Layer it or wear it loud — it sits right on every body.',
  },
  {
    id: 'fabric',
    range: [0.28, 0.46],
    side: 'left',
    top: '52%',
    dotX: '46%',
    kicker: '02 — Fabric',
    title: '380 GSM loop-knit fleece',
    detail: 'Heavyweight, brushed-back cotton. Premium hand-feel that survives Karachi summers and Murree winters.',
  },
  {
    id: 'stitch',
    range: [0.52, 0.68],
    side: 'right',
    top: '30%',
    dotX: '54%',
    kicker: '03 — Construction',
    title: 'Reinforced double-stitch shoulders',
    detail: 'Twin-needle seams that hold their shape wash after wash. Built to outlast the hype.',
  },
  {
    id: 'print',
    range: [0.72, 0.9],
    side: 'left',
    top: '46%',
    dotX: '48%',
    kicker: '04 — Detail',
    title: 'Crack-proof screen print',
    detail: 'Plastisol-cured desi graphics with a western edge. The vibe stays sharp, never flakes.',
  },
];

export default function RevealScene() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0); // shared with the 3D scene (read in useFrame)
  const [p, setP] = useState(0); // React state only for marker/UI toggling

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    progress.current = v;
    setP(v);
  });

  return (
    <section ref={wrapRef} className="relative h-[420vh] bg-ink-950" id="reveal">
      {/* Pinned viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Section heading */}
        <div className="pointer-events-none absolute left-0 top-0 z-20 w-full px-6 pt-8 text-center md:pt-12">
          <p className="font-display text-xs tracking-[0.4em] text-vybe md:text-sm">
            THE ANATOMY OF A VYBE
          </p>
          <h2 className="mt-2 font-display text-2xl text-chalk/90 md:text-4xl">
            Every detail, revealed.
          </h2>
        </div>

        {/* 3D canvas */}
        <div className="absolute inset-0 z-0">
          <Canvas
            shadows
            camera={{ position: [0, 0.55, 4.3], fov: 42 }}
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 2]}
          >
            <color attach="background" args={['#08080a']} />
            <ambientLight intensity={0.35} />
            <directionalLight
              position={[3, 5, 4]}
              intensity={2.2}
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
            {/* accent rim light — the "vybe" glow */}
            <pointLight position={[-3, 2, -4]} intensity={40} color="#d4ff3f" />
            <pointLight position={[4, -1, 2]} intensity={12} color="#ff3d68" />

            <Suspense fallback={null}>
              <Model progress={progress} />
            </Suspense>

            <ContactShadows
              position={[0, -1.3, 0]}
              opacity={0.5}
              scale={8}
              blur={2.6}
              far={4}
              color="#000000"
            />
          </Canvas>
        </div>

        {/* Annotation markers overlay */}
        <div className="absolute inset-0 z-10">
          {MARKERS.map((m) => {
            const active = p >= m.range[0] && p <= m.range[1];
            return <MarkerCard key={m.id} marker={m} active={active} />;
          })}
        </div>

        {/* Mobile caption (markers are desktop-only) */}
        <div className="absolute bottom-20 left-0 z-20 w-full px-6 md:hidden">
          {MARKERS.map((m) => {
            const active = p >= m.range[0] && p <= m.range[1];
            if (!active) return null;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-sm border border-white/10 bg-ink-900/85 p-4 text-center backdrop-blur-md"
              >
                <p className="font-display text-[10px] tracking-[0.3em] text-vybe">
                  {m.kicker}
                </p>
                <h3 className="mt-1 font-display text-lg text-chalk">{m.title}</h3>
                <p className="mt-1 text-sm text-chalk/60">{m.detail}</p>
              </motion.div>
            );
          })}
        </div>

        {/* progress rail */}
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {MARKERS.map((m, i) => {
            const active = p >= m.range[0];
            return (
              <span
                key={m.id}
                className={`h-1 rounded-full transition-all duration-500 ${
                  active ? 'w-10 bg-vybe' : 'w-6 bg-white/20'
                }`}
                aria-hidden
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MarkerCard({ marker, active }: { marker: Marker; active: boolean }) {
  const isLeft = marker.side === 'left';
  return (
    <div
      className="absolute hidden md:block"
      style={{
        top: marker.top,
        left: marker.dotX,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Dot + pulse */}
      <div className="relative">
        <motion.span
          className="absolute -left-2 -top-2 block h-4 w-4 rounded-full bg-vybe/40"
          animate={active ? { scale: [0.9, 1.7], opacity: [0.7, 0] } : { opacity: 0 }}
          transition={{ duration: 2, repeat: active ? Infinity : 0 }}
        />
        <span className="block h-1.5 w-1.5 rounded-full bg-vybe ring-2 ring-vybe/40" />
      </div>

      {/* Connector line + card */}
      <motion.div
        className={`absolute top-1/2 flex items-center gap-3 ${
          isLeft ? 'right-2 flex-row-reverse' : 'left-2'
        }`}
        style={{ [isLeft ? 'right' : 'left']: '10px' } as React.CSSProperties}
        initial={false}
        animate={{
          opacity: active ? 1 : 0,
          x: active ? 0 : isLeft ? 16 : -16,
        }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="h-px w-16 bg-gradient-to-r from-vybe/80 to-transparent" />
        <div
          className={`w-64 border border-white/10 bg-ink-900/80 p-4 backdrop-blur-md ${
            isLeft ? 'text-right' : 'text-left'
          }`}
        >
          <p className="font-display text-[10px] tracking-[0.3em] text-vybe">
            {marker.kicker}
          </p>
          <h3 className="mt-1 font-display text-lg leading-tight text-chalk">
            {marker.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-chalk/60">{marker.detail}</p>
        </div>
      </motion.div>
    </div>
  );
}
