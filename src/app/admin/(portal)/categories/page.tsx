import type { Metadata } from 'next';
import { requireStaffPage } from '@/lib/auth/session';
import { listCategoryTree } from '@/lib/repositories/categories.repo';
import { countProductsReferencing } from '@/lib/repositories/products.repo';
import { deleteCategory } from '@/lib/actions/admin/catalog.actions';
import { PageHeader } from '@/components/admin/PageHeader';
import { Panel } from '@/components/admin/Panel';
import { Disclosure } from '@/components/admin/Disclosure';
import { ActionButton } from '@/components/admin/ActionButton';
import { CategoryForm } from '@/components/admin/forms/CategoryForm';
import { EmptyState } from '@/components/admin/EmptyState';
import type { Category } from '@/types/domain';

export const metadata: Metadata = { title: 'Categories' };

export default async function AdminCategoriesPage() {
  const user = await requireStaffPage();
  const all = await listCategoryTree();
  const counts = new Map(await Promise.all(all.map(async (c) => [c._id.toString(), await countProductsReferencing('categoryIds', c._id.toString())] as const)));
  const roots = all.filter((c) => !c.parentId);
  const childrenOf = (id: string) => all.filter((c) => c.parentId?.toString() === id);
  const parentOptions = roots.map((r) => ({ id: r._id.toString(), name: r.name }));

  function Row({ category, depth }: { category: Category; depth: number }) {
    const id = category._id.toString();
    const inUse = counts.get(id) ?? 0;
    return (
      <li className={`border-b border-ink/5 py-3 ${depth > 0 ? 'pl-6' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-ink">
              {depth > 0 && <span className="text-ink-400">↳ </span>}
              {category.name}
            </p>
            <p className="text-xs text-ink-400">
              /category/{category.slug} · order {category.order} · {inUse} product{inUse === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Disclosure label="Edit">
              <div className="border border-ink/10 bg-ivory p-4">
                <CategoryForm
                  categoryId={id}
                  initial={{ name: category.name, slug: category.slug, parentId: category.parentId?.toString() ?? null, order: category.order, description: category.description, imageUrl: category.imageUrl }}
                  parentOptions={parentOptions}
                />
              </div>
            </Disclosure>
            {user.role === 'admin' && (
              <ActionButton action={deleteCategory.bind(null, id)} variant="danger" confirm={`Delete "${category.name}"?`}>
                Delete
              </ActionButton>
            )}
          </div>
        </div>
      </li>
    );
  }

  return (
    <>
      <PageHeader title="Categories" description="Two levels: top-level categories and their sub-categories. These drive the storefront navigation." />
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="All categories">
          {all.length === 0 ? (
            <EmptyState title="No categories yet" hint="Add one using the form." />
          ) : (
            <ul className="-mt-3">
              {roots.map((root) => (
                <li key={root._id.toString()}>
                  <ul>
                    <Row category={root} depth={0} />
                    {childrenOf(root._id.toString()).map((child) => (
                      <Row key={child._id.toString()} category={child} depth={1} />
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Add category" className="self-start">
          <CategoryForm categoryId={null} parentOptions={parentOptions} />
        </Panel>
      </div>
    </>
  );
}
