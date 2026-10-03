import SmoothScroll from '@/components/SmoothScroll';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import FloatGalleryClient from '@/components/gallery/FloatGalleryClient';
import HoodieRevealClient from '@/components/reveal3d/HoodieRevealClient';
import Drop from '@/components/Drop';
import Story from '@/components/Story';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import { getProducts } from '@/lib/api';

export default async function Home() {
  const products = await getProducts();

  return (
    <SmoothScroll>
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <FloatGalleryClient />
        <HoodieRevealClient />
        <Drop products={products} />
        <Story />
        <Newsletter />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
