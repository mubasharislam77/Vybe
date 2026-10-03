import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/repositories/products.repo';
import { ProductView } from '@/components/product/ProductView';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { ReviewsSection } from '@/components/product/ReviewsSection';
import { Container } from '@/components/ui/Container';
import { formatPKR } from '@/lib/utils/money';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.seoTitle || product.title,
    description: product.seoDescription || product.description.slice(0, 160),
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160),
      images: product.images[0]?.url ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const prices = product.variants.map((v) => v.priceMinor);
  const minPrice = Math.min(...prices);
  const inStock = product.variants.some(
    (v) => product.fulfillment === 'made_to_order' || v.stock > 0,
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.images.map((i) => i.url),
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'PKR',
      lowPrice: minPrice / 100,
      highPrice: Math.max(...prices) / 100,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Container className="py-10 lg:py-16">
        <nav aria-label="Breadcrumb" className="mb-8 text-xs text-ink-400">
          <a href="/shop" className="hover:text-ink">
            Shop
          </a>{' '}
          / <span className="text-ink">{product.title}</span>
        </nav>

        <ProductView
          slug={product.slug}
          title={product.title}
          productImages={product.images.map((i) => ({ url: i.url, alt: i.alt }))}
          variants={product.variants.map((v) => ({
            sku: v.sku,
            size: v.size,
            colorName: v.colorName,
            colorSwatchHex: v.colorSwatchHex,
            priceMinor: v.priceMinor,
            compareAtPriceMinor: v.compareAtPriceMinor ?? null,
            stock: v.stock,
            images: v.images.map((i) => ({ url: i.url, alt: i.alt })),
          }))}
          fulfillment={product.fulfillment}
          productionLeadTimeDays={product.productionLeadTimeDays}
          fabric={product.fabric}
          fit={product.fit}
          careInstructions={product.careInstructions}
        />

        <div className="mt-16 max-w-3xl">
          <h2 className="mb-3 font-display text-xl uppercase tracking-widest2 text-ink">Description</h2>
          <p className="whitespace-pre-line text-sm text-ink-600">{product.description}</p>
          <p className="mt-4 text-xs text-ink-400">Sample product — pricing shown from {formatPKR(minPrice)}.</p>
        </div>
      </Container>

      <ReviewsSection productId={product._id.toString()} />
      <RelatedProducts product={product} />
    </>
  );
}
