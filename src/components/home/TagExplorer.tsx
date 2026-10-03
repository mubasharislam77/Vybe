import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/components/ui/ScrollReveal';

const TAG_LABELS: Record<string, string> = {
  graphic: 'Graphic',
  minimal: 'Minimal',
  cultural: 'Cultural',
  anime: 'Anime',
  seasonal: 'Seasonal',
};

export function TagExplorer({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <RevealOnScroll y={16}>
          <h2 className="mb-8 font-display text-2xl uppercase tracking-widest2 text-ink sm:text-3xl">
            Shop the Vibe
          </h2>
        </RevealOnScroll>
        <div className="flex flex-wrap gap-3">
          {tags.map((tag, i) => (
            <RevealOnScroll key={tag} delay={i * 0.06} y={14} scale={0.92}>
              <Link
                href={`/shop?tag=${encodeURIComponent(tag)}`}
                className="group inline-flex min-h-[48px] items-center gap-2 border border-ink/20 px-5 font-display text-sm uppercase tracking-widest2 text-ink transition-colors hover:border-ink hover:bg-ink hover:text-ivory"
              >
                {TAG_LABELS[tag] ?? tag}
                <span className="text-lime opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </Link>
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  );
}
