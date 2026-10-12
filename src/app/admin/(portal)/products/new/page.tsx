import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStaffPage } from '@/lib/auth/session';
import { PageHeader } from '@/components/admin/PageHeader';
import { ProductForm } from '@/components/admin/forms/ProductForm';
import { linkClass } from '@/components/admin/styles';
import { loadProductFormOptions } from '../_options';

export const metadata: Metadata = { title: 'New product' };

export default async function AdminNewProductPage() {
  const user = await requireStaffPage();
  const { categories, collections } = await loadProductFormOptions();
  return (
    <>
      <PageHeader
        title="New product"
        description="Save as a draft first, then publish once images and variants look right."
        actions={
          <Link href="/admin/products" className={`${linkClass} text-xs`}>
            ← All products
          </Link>
        }
      />
      <ProductForm productId={null} initial={null} categories={categories} collections={collections} canDelete={user.role === 'admin'} />
    </>
  );
}
