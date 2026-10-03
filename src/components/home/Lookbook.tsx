import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { ScrollSpin, ScrollDrift } from '@/components/ui/ScrollMotion';
import { RingShape, SquareOutline } from '@/components/ui/Shapes';

const FRAMES = [
  { src: '/products/street-01.jpg', alt: 'Street styling, lookbook frame one' },
  { src: '/products/hoodie-03.jpg', alt: 'Street styling, lookbook frame two' },
  { src: '/products/street-02.jpg', alt: 'Street styling, lookbook frame three' },
];

export function Lookbook() {
  return (
    <section className="grain relative overflow-hidden bg-ink py-16 text-ivory sm:py-24">
      <ScrollSpin factor={0.07} className="absolute -right-16 top-0 z-0 hidden lg:block">
        <RingShape size={260} color="lime" opacity={0.15} />
      </ScrollSpin>
      <ScrollDrift factor={0.1} axis="y" className="absolute bottom-0 left-[4%] z-0 hidden sm:block">
        <SquareOutline size={120} color="ivory" opacity={0.08} />
      </ScrollDrift>
      <Container className="relative">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-widest2 text-lime">The Lookbook</p>
            <h2 className="font-display text-3xl uppercase tracking-tight sm:text-5xl">Styled for the street.</h2>
          </div>
          <Link href="/shop" className="text-sm text-ivory/70 underline-offset-4 hover:text-ivory hover:underline">
            Shop the edit →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {FRAMES.map((frame, i) => (
            <div
              key={frame.src}
              className={`relative overflow-hidden ${i === 0 ? 'sm:col-span-2 sm:row-span-2 aspect-[4/5] sm:aspect-[4/5]' : 'aspect-[4/5]'}`}
            >
              <Image
                src={frame.src}
                alt={frame.alt}
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs uppercase tracking-widest2 text-ivory/40">Sample photography — not final campaign imagery</p>
      </Container>
    </section>
  );
}
