import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/components/ui/ScrollReveal';

const AUDIENCES: { value: 'men' | 'women' | 'unisex'; label: string; image: string }[] = [
  { value: 'men', label: 'Men', image: '/products/hoodie-02.jpg' },
  { value: 'women', label: 'Women', image: '/products/street-02.jpg' },
  { value: 'unisex', label: 'Unisex', image: '/products/tee-02.jpg' },
];

export function ShopByAudience() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <RevealOnScroll y={16}>
          <h2 className="mb-8 font-display text-2xl uppercase tracking-widest2 text-ink sm:text-3xl">Shop For</h2>
        </RevealOnScroll>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {AUDIENCES.map((a, i) => (
            <RevealOnScroll key={a.value} delay={i * 0.1} y={28} scale={0.96}>
              <Link href={`/shop?audience=${a.value}`} className="group relative block aspect-[3/4] overflow-hidden bg-ink/5">
                <Image
                  src={a.image}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                <p className="absolute bottom-6 left-6 font-display text-2xl uppercase tracking-tight text-ivory sm:text-3xl">
                  {a.label}
                </p>
              </Link>
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  );
}
