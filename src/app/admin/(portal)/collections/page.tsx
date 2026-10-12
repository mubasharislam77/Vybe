import type { Metadata } from 'next';
import { requireStaffPage } from '@/lib/auth/session';
import { listAllCollectionsForAdmin } from '@/lib/repositories/collections.repo';
import { countProductsReferencing } from '@/lib/repositories/products.repo';
import { deleteCollection } from '@/lib/actions/admin/catalog.actions';
import { formatDate, toDateTimeLocalValue } from '@/lib/utils/dates';
import { PageHeader } from '@/components/admin/PageHeader';
import { Panel } from '@/components/admin/Panel';
import { Disclosure } from '@/components/admin/Disclosure';
import { ActionButton } from '@/components/admin/ActionButton';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { CollectionForm } from '@/components/admin/forms/CollectionForm';
import { EmptyState } from '@/components/admin/EmptyState';

export const metadata: Metadata = { title: 'Collections' };

export default async function AdminCollectionsPage() {
  const user = await requireStaffPage();
  const collections = await listAllCollectionsForAdmin();
  const counts = new Map(
    await Promise.all(collections.map(async (c) => [c._id.toString(), await countProductsReferencing('collectionIds', c._id.toString())] as const)),
  );

  return (
    <>
      <PageHeader title="Collections" description="Seasonal drops and lookbooks. A collection can be scheduled with start/end dates and toggled off without deleting it." />
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="All collections">
          {collections.length === 0 ? (
            <EmptyState title="No collections yet" hint="Add one using the form." />
          ) : (
            <ul className="-mt-3">
              {collections.map((c) => {
                const id = c._id.toString();
                const inUse = counts.get(id) ?? 0;
                return (
                  <li key={id} className="border-b border-ink/5 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 font-medium text-ink">
                          {c.name} <StatusBadge status={c.isActive ? 'active' : 'inactive'} />
                        </p>
                        <p className="text-xs text-ink-400">
                          /collections/{c.slug} · {inUse} product{inUse === 1 ? '' : 's'}
                          {c.startsAt ? ` · from ${formatDate(c.startsAt)}` : ''}
                          {c.endsAt ? ` to ${formatDate(c.endsAt)}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Disclosure label="Edit">
                          <div className="border border-ink/10 bg-ivory p-4">
                            <CollectionForm
                              collectionId={id}
                              initial={{
                                name: c.name,
                                slug: c.slug,
                                description: c.description,
                                bannerImageUrl: c.bannerImageUrl,
                                isActive: c.isActive,
                                startsAt: toDateTimeLocalValue(c.startsAt),
                                endsAt: toDateTimeLocalValue(c.endsAt),
                              }}
                            />
                          </div>
                        </Disclosure>
                        {user.role === 'admin' && (
                          <ActionButton action={deleteCollection.bind(null, id)} variant="danger" confirm={`Delete "${c.name}"?`}>
                            Delete
                          </ActionButton>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <Panel title="Add collection" className="self-start">
          <CollectionForm collectionId={null} />
        </Panel>
      </div>
    </>
  );
}
