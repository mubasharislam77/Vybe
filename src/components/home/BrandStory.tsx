import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { ScrollSpin } from '@/components/ui/ScrollMotion';
import { PlusShape } from '@/components/ui/Shapes';
import { RevealOnScroll } from '@/components/ui/ScrollReveal';

export function BrandStory() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <ScrollSpin factor={0.1} className="absolute left-1/2 top-8 z-0 -translate-x-1/2">
        <PlusShape size={40} color="burgundy" opacity={0.2} />
      </ScrollSpin>
      <Container className="relative max-w-3xl text-center">
        <RevealOnScroll y={20} scale={0.97}>
          <p className="mb-3 font-display text-xs uppercase tracking-widest2 text-burgundy">Our Story</p>
          <h2 className="font-display text-3xl uppercase tracking-tight text-ink sm:text-5xl">
            Desi roots. Global vibe.
          </h2>
          <p className="mt-6 text-base text-ink-600 sm:text-lg">
            VybeTheBrand started as a question: why does streetwear from here always have to borrow
            someone else&apos;s language? We build heavyweight basics and graphic pieces that speak in
            ours — cut for the culture, made to be worn hard and often.
          </p>
          <Link
            href="/about"
            className="mt-6 inline-block text-sm font-medium text-ink underline-offset-4 hover:text-burgundy hover:underline"
          >
            Read more about the brand →
          </Link>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
