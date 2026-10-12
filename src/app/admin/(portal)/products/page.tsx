import type { Metadata } from 'next';
import Link from 'next/link';
import { listProductsForAdmin } from '@/lib/repositories/products.repo';
import { setProductFeatured, setProductStatus } from '@/lib/actions/admin/products.actions';
import { formatPKR } from '@/lib/utils/money';
import { formatDate } from '@/lib/utils/dates';
import { getParam, type SearchParamsInput } from '@/lib/utils/query-params';
import { PageHeader } from '@/components/admin/PageHeader';
import { SearchFilterBar } from '@/components/admin/SearchFilterBar';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { EmptyState } from '@/components/admin/EmptyState';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { ActionButton } from '@/components/admin/ActionButton';
import { LinkButton } from '@/components/ui/Button';
import { tableWrapClass, tableClass, tdClass, thClass, smallButtonClass } from '@/components/admin/styles';

export const metadata: Metadata = { title: 'Products' };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SearchParamsInput> }) {
  const params = await searchParams;
  const q = getParam(params, 'q')?.trim() || undefined;
  const statusRaw = getParam(params, 'status');
  const status = statusRaw === 'draft' || statusRaw === 'published' ? statusRaw : undefined;
  const stock = getParam(params, 'stock') === 'low' ? 'low' : undefined;

  const { items, nextCursor } = await listProductsForAdmin({ q, status, lowStock: stock === 'low', cursor: getParam(params, 'cursor'), pageSize: 30 });

  return (
    <>
      <PageHeader
        title="Products"
        description="Search by title, slug, SKU or tag."
        actions={
          <LinkButton href="/admin/products/new" size="sm">
            + New product
          </LinkButton>
        }
      />
      <SearchFilterBar
        basePath="/admin/products"
        q={q}
        placeholder="Title, slug, SKU, tag…"
        selects={[
          { name: 'status', label: 'Status', value: status, options: [{ value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' }] },
          { name: 'stock', label: 'Stock', value: stock, options: [{ value: 'low', label: 'Low (≤ 3 units)' }] },
        ]}
      />

      <div className={tableWrapClass}>
        {items.length === 0 ? (
          <EmptyState title="No products found" hint={q ? 'Try a different search.' : 'Create your first product to get started.'} action={<LinkButton href="/admin/products/new" size="sm">+ New product</LinkButton>} />
        ) : (
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Product</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Price</th>
                <th className={thClass}>Stock</th>
                <th className={thClass}>Sold</th>
                <th className={thClass}>Updated</th>
                <th className={thClass}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const id = p._id.toString();
                const prices = p.variants.map((v) => v.priceMinor);
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                const totalStock = p.variants.reduce((n, v) => n + v.stock, 0);
                const lowCount = p.variants.filter((v) => v.stock <= 3).length;
                return (
                  <tr key={id} className="hover:bg-ivory/60">
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        {p.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0].url} alt="" className="h-14 w-11 shrink-0 object-cover" />
                        ) : (
                          <span className="h-14 w-11 shrink-0 bg-ink/5" />
                        )}
                        <div className="min-w-0">
                          <Link href={`/admin/products/${id}/edit`} className="block truncate font-medium text-ink underline-offset-4 hover:underline">
                            {p.title}
                          </Link>
                          <span className="block text-xs text-ink-400">
                            /{p.slug} · {p.audience} · {p.variants.length} variant{p.variants.length === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge status={p.status} />
                        {p.featured && <StatusBadge status="featured" label="Featured" />}
                      </div>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>{min === max ? formatPKR(min) : `${formatPKR(min)} – ${formatPKR(max)}`}</td>
                    <td className={tdClass}>
                      {p.fulfillment === 'made_to_order' ? (
                        <span className="text-xs text-ink-600">Made to order</span>
                      ) : (
                        <>
                          {totalStock}
                          {lowCount > 0 && <span className="ml-1 bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">{lowCount} low</span>}
                        </>
                      )}
                    </td>
                    <td className={tdClass}>{p.salesCount}</td>
                    <td className={`${tdClass} whitespace-nowrap text-xs text-ink-600`}>{formatDate(p.updatedAt)}</td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <div className="flex flex-wrap justify-end gap-1">
                        <Link href={`/products/${p.slug}`} target="_blank" rel="noreferrer" className={`${smallButtonClass} min-h-[32px] px-2 text-[11px]`}>
                          View
                        </Link>
                        <ActionButton action={setProductStatus.bind(null, id, p.status === 'published' ? 'draft' : 'published')} className="min-h-[32px] px-2 text-[11px]">
                          {p.status === 'published' ? 'Unpublish' : 'Publish'}
                        </ActionButton>
                        <ActionButton action={setProductFeatured.bind(null, id, !p.featured)} className="min-h-[32px] px-2 text-[11px]">
                          {p.featured ? 'Unfeature' : 'Feature'}
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <AdminPagination basePath="/admin/products" searchParams={params} nextCursor={nextCursor} />
    </>
  );
}
