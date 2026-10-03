import { AmbientScrollProvider } from '@/components/ui/AmbientScrollProvider';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import Hero from '@/components/Hero';
import { FeaturedCategories } from '@/components/home/FeaturedCategories';
import { ProductRail } from '@/components/home/ProductRail';
import { Lookbook } from '@/components/home/Lookbook';
import { BrandStory } from '@/components/home/BrandStory';
import { ShoppingInfo } from '@/components/home/ShoppingInfo';
import { listProducts, listFeatured } from '@/lib/repositories/products.repo';
import { getCategoryNav, toProductCardData } from '@/lib/services/catalog.service';
import { getStoreSettings } from '@/lib/repositories/settings.repo';
import { listingQuerySchema } from '@/lib/validation/product';

export default async function Home() {
  const [categories, settings, latestDrop, featured] = await Promise.all([
    getCategoryNav(),
    getStoreSettings(),
    listProducts(listingQuerySchema.parse({ collection: 'monsoon-drop', sort: 'newest' })),
    listFeatured(8),
  ]);

  const featuredCards = featured.map((p) => ({
    slug: p.slug,
    title: p.title,
    imageUrl: p.images[0]?.url ?? '/products/tee-01.jpg',
    imageAlt: p.images[0]?.alt ?? p.title,
    minPriceMinor: Math.min(...p.variants.map((v) => v.priceMinor)),
    maxPriceMinor: Math.max(...p.variants.map((v) => v.priceMinor)),
    compareAtMinor: p.variants.find((v) => v.compareAtPriceMinor)?.compareAtPriceMinor ?? null,
    featured: p.featured,
    fulfillment: p.fulfillment,
  }));

  return (
    <AmbientScrollProvider>
      <SiteHeader />
      <main>
        <Hero />
        <FeaturedCategories categories={categories} />
        <ProductRail
          title="Latest Drop"
          description="Monsoon Drop — the season's first capsule."
          viewAllHref="/collections/monsoon-drop"
          products={latestDrop.items.map(toProductCardData)}
        />
        <Lookbook />
        <ProductRail
          title="Featured"
          viewAllHref="/shop"
          products={featuredCards}
        />
        <BrandStory />
        <ShoppingInfo settings={settings} />
      </main>
      <SiteFooter />
    </AmbientScrollProvider>
  );
}
