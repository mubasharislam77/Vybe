'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Reveal from './ui/Reveal';
import { formatPKR, type Product } from '@/lib/products';

export default function Drop({ products }: { products: Product[] }) {
  return (
    <section id="drop" className="relative bg-ink-950 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-14 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-display text-xs tracking-[0.4em] text-vybe">DROP 01</p>
            <h2 className="mt-3 font-display text-4xl leading-none text-chalk md:text-6xl">
              Wear the vibe.
            </h2>
          </div>
          <p className="max-w-sm text-sm text-chalk/60">
            Limited runs, heavyweight fabric, desi soul. Once it&apos;s gone, it&apos;s gone
            — no restocks, only new vibes.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), {
    stiffness: 200,
    damping: 18,
  });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), {
    stiffness: 200,
    damping: 18,
  });

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 800 }}
      className="group relative cursor-pointer border border-white/10 bg-ink-900"
    >
      {/* product photo (swap files in /public/products for your own shots) */}
      <div
        className="relative aspect-[4/5] overflow-hidden"
        style={{
          background: `radial-gradient(120% 120% at 50% 20%, ${product.swatch[0]}, ${product.swatch[1]})`,
        }}
      >
        {product.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-transparent to-transparent" />
        {product.tag && (
          <span className="absolute left-3 top-3 bg-ink-950/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-vybe backdrop-blur">
            {product.tag}
          </span>
        )}
        <span className="absolute bottom-3 right-3 text-[10px] uppercase tracking-widest text-chalk/70">
          {product.category}
        </span>
      </div>

      <div className="flex items-center justify-between p-4">
        <div>
          <h3 className="font-display text-sm leading-tight text-chalk">{product.name}</h3>
          <p className="mt-1 text-sm text-chalk/50">{formatPKR(product.pricePKR)}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-chalk/60 transition-all group-hover:border-vybe group-hover:bg-vybe group-hover:text-ink-950">
          +
        </span>
      </div>
    </motion.div>
  );
}
