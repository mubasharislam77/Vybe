import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStaffPage } from '@/lib/auth/session';
import { getProductById } from '@/lib/repositories/products.repo';
import { productToInput } from '@/lib/services/admin-product.service';
import { listAuditLogs } from '@/lib/repositories/audit.repo';
import { formatDateTime } from '@/lib/utils/dates';
import { PageHeader } from '@/components/admin/PageHeader';
import { ProductForm } from '@/components/admin/forms/ProductForm';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { FormMessage } from '@/components/admin/FormMessage';
import { linkClass } from '@/components/admin/styles';
import { loadProductFormOptions } from '../../_options';

export const metadata: Metadata = { title: 'Edit product' };

export default async function AdminEditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await requireStaffPage();
  const { id } = await params;
  const { created } = await searchParams;
  const product = await getProductById(id);
  if (!product) notFound();

  const [{ categories, collections }, history] = await Promise.all([
    loadProductFormOptions(),
    listAuditLogs({ targetType: 'product', targetId: id, limit: 10 }),
  ]);

  return (
    <>
      <PageHeader
        title={product.title}
        description={`Sold ${product.salesCount} · created ${formatDateTime(product.createdAt)}`}
        actions={
          <>
            <StatusBadge status={product.status} />
            <Link href={`/products/${product.slug}`} target="_blank" rel="noreferrer" className={`${linkClass} text-xs`}>
              View on store ↗
            </Link>
            <Link href="/admin/products" className={`${linkClass} text-xs`}>
              ← All products
            </Link>
          </>
        }
      />
      {created && <div className="mb-4"><FormMessage success="Product created. It stays hidden until you set the status to Published." /></div>}
      <ProductForm productId={id} initial={productToInput(product)} categories={categories} collections={collections} canDelete={user.role === 'admin'} />
      {history.length > 0 && (
        <section className="mt-8 border-t border-ink/10 pt-6">
          <h2 className="mb-3 font-display text-sm uppercase tracking-widest2">Recent changes</h2>
          <ul className="flex flex-col gap-1 text-xs text-ink-600">
            {history.map((h) => (
              <li key={h._id.toString()}>
                <span className="font-medium text-ink">{h.action.replace(/[._]/g, ' ')}</span> · {h.actorEmail} · {formatDateTime(h.at)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
