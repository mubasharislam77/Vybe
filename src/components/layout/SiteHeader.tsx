import { getCategoryNav } from '@/lib/services/catalog.service';
import Navbar from '@/components/Navbar';

export default async function SiteHeader() {
  const categories = await getCategoryNav();
  return <Navbar categories={categories} />;
}
