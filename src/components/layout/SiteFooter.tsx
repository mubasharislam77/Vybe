import { getCategoryNav } from '@/lib/services/catalog.service';
import { getStoreSettings } from '@/lib/repositories/settings.repo';
import Footer from '@/components/Footer';

export default async function SiteFooter() {
  const [categories, settings] = await Promise.all([getCategoryNav(), getStoreSettings()]);
  return <Footer categories={categories} settings={settings} />;
}
