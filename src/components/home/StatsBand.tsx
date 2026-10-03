import { Container } from '@/components/ui/Container';
import { CountUp } from '@/components/ui/CountUp';
import { RevealOnScroll } from '@/components/ui/ScrollReveal';

export function StatsBand({ productCount }: { productCount: number }) {
  return (
    <section className="bg-ink py-14 text-ivory sm:py-20">
      <Container>
        <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
          <RevealOnScroll y={16}>
            <p className="font-display text-4xl text-lime sm:text-5xl">
              <CountUp value={productCount} suffix="+" />
            </p>
            <p className="mt-2 text-xs uppercase tracking-widest2 text-ivory/60">Styles live</p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.08} y={16}>
            <p className="font-display text-4xl text-lime sm:text-5xl">
              <CountUp value={240} suffix=" GSM" />
            </p>
            <p className="mt-2 text-xs uppercase tracking-widest2 text-ivory/60">Heavyweight cotton</p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.16} y={16}>
            <p className="font-display text-4xl text-lime sm:text-5xl">
              <CountUp value={7} />
            </p>
            <p className="mt-2 text-xs uppercase tracking-widest2 text-ivory/60">Day easy returns</p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.24} y={16}>
            <p className="font-display text-4xl text-lime sm:text-5xl">COD</p>
            <p className="mt-2 text-xs uppercase tracking-widest2 text-ivory/60">Nationwide delivery</p>
          </RevealOnScroll>
        </div>
      </Container>
    </section>
  );
}
