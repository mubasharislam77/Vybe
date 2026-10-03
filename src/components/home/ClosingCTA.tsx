import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/components/ui/ScrollReveal';
import { ScrollSpin } from '@/components/ui/ScrollMotion';
import { RingShape, DiamondShape } from '@/components/ui/Shapes';
import type { StoreSettings } from '@/types/domain';

export function ClosingCTA({ settings }: { settings: StoreSettings }) {
  return (
    <section className="relative overflow-hidden bg-burgundy py-20 text-ivory sm:py-28">
      <ScrollSpin factor={0.09} className="absolute -left-20 -top-20 z-0 hidden lg:block">
        <RingShape size={300} color="ivory" opacity={0.1} />
      </ScrollSpin>
      <div className="absolute bottom-8 right-[8%] z-0 hidden sm:block">
        <DiamondShape size={28} color="lime" opacity={0.6} />
      </div>

      <Container className="relative z-10 text-center">
        <RevealOnScroll y={30} scale={0.96}>
          <p className="mb-3 font-display text-xs uppercase tracking-widest2 text-lime">Join the Movement</p>
          <h2 className="font-display text-4xl uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            Wear it loud.
            <br />
            Wear it proud.
          </h2>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/shop"
              className="inline-flex min-h-[44px] items-center justify-center bg-lime px-8 py-4 font-display text-sm uppercase tracking-widest2 text-ink transition-colors hover:bg-ivory"
            >
              Shop The Full Collection
            </Link>
            {settings.whatsappSupportNumberE164 && (
              <a
                href={`https://wa.me/${settings.whatsappSupportNumberE164.replace('+', '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center border border-ivory/40 px-8 py-4 font-display text-sm uppercase tracking-widest2 text-ivory transition-colors hover:border-lime hover:text-lime"
              >
                Chat on WhatsApp
              </a>
            )}
          </div>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
