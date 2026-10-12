'use server';

import { revalidatePath } from 'next/cache';
import { categoryInputSchema, collectionInputSchema } from '@/lib/validation/category';
import { objectIdSchema } from '@/lib/validation/common';
import {
  createCategory,
  deleteCategory as deleteCategoryDoc,
  getCategoryById,
  getCategoryBySlug,
  listCategoryTree,
  updateCategory,
} from '@/lib/repositories/categories.repo';
import {
  createCollection,
  deleteCollection as deleteCollectionDoc,
  getCollectionById,
  getCollectionBySlug,
  updateCollection,
} from '@/lib/repositories/collections.repo';
import { countProductsReferencing } from '@/lib/repositories/products.repo';
import { runAdminAction, audit, fail, ok, firstIssue, type AdminActionResult } from './_shared';

class CatalogError extends Error {}

function revalidateCatalogNav() {
  // The category nav is rendered in the storefront header on every page.
  revalidatePath('/', 'layout');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/collections');
}

export async function saveCategory(id: string | null, rawInput: unknown): Promise<AdminActionResult<{ id: string }>> {
  return runAdminAction('staff', async (actor) => {
    const parsed = categoryInputSchema.safeParse(rawInput);
    if (!parsed.success) return fail(firstIssue(parsed.error));

    const slugOwner = await getCategoryBySlug(parsed.data.slug);
    if (slugOwner && slugOwner._id.toString() !== id) throw new CatalogError('A category with this slug already exists.');

    if (parsed.data.parentId) {
      if (parsed.data.parentId === id) throw new CatalogError('A category cannot be its own parent.');
      const parent = await getCategoryById(parsed.data.parentId);
      if (!parent) throw new CatalogError('Parent category not found.');
      if (parent.parentId) throw new CatalogError('Only two levels are supported — pick a top-level parent.');
    }

    if (id === null) {
      const created = await createCategory(parsed.data);
      await audit(actor, 'category.created', 'category', created._id.toString(), { slug: created.slug, name: created.name });
      revalidateCatalogNav();
      return ok({ id: created._id.toString() });
    }

    const idCheck = objectIdSchema.safeParse(id);
    if (!idCheck.success) return fail('Invalid category id.');
    const existing = await getCategoryById(idCheck.data);
    if (!existing) return fail('Category not found.');
    if (parsed.data.parentId) {
      const children = (await listCategoryTree()).filter((c) => c.parentId?.toString() === idCheck.data);
      if (children.length > 0) throw new CatalogError('This category has sub-categories, so it must stay top-level.');
    }
    await updateCategory(idCheck.data, parsed.data);
    await audit(actor, 'category.updated', 'category', idCheck.data, { slug: parsed.data.slug, name: parsed.data.name });
    revalidateCatalogNav();
    return ok({ id: idCheck.data });
  });
}

export async function deleteCategory(categoryId: string): Promise<AdminActionResult> {
  return runAdminAction('admin', async (actor) => {
    const idCheck = objectIdSchema.safeParse(categoryId);
    if (!idCheck.success) return fail('Invalid request.');
    const existing = await getCategoryById(idCheck.data);
    if (!existing) return fail('Category not found.');

    const children = (await listCategoryTree()).filter((c) => c.parentId?.toString() === idCheck.data);
    if (children.length > 0) throw new CatalogError('Delete or move its sub-categories first.');
    const inUse = await countProductsReferencing('categoryIds', idCheck.data);
    if (inUse > 0) throw new CatalogError(`${inUse} product(s) are still in this category. Reassign them first.`);

    await deleteCategoryDoc(idCheck.data);
    await audit(actor, 'category.deleted', 'category', idCheck.data, { slug: existing.slug, name: existing.name });
    revalidateCatalogNav();
    return ok();
  });
}

export async function saveCollection(id: string | null, rawInput: unknown): Promise<AdminActionResult<{ id: string }>> {
  return runAdminAction('staff', async (actor) => {
    const parsed = collectionInputSchema.safeParse(rawInput);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    if (parsed.data.startsAt && parsed.data.endsAt && parsed.data.endsAt < parsed.data.startsAt) {
      throw new CatalogError('End date must be after the start date.');
    }

    const slugOwner = await getCollectionBySlug(parsed.data.slug);
    if (slugOwner && slugOwner._id.toString() !== id) throw new CatalogError('A collection with this slug already exists.');

    if (id === null) {
      const created = await createCollection(parsed.data);
      await audit(actor, 'collection.created', 'collection', created._id.toString(), { slug: created.slug, name: created.name });
      revalidateCatalogNav();
      return ok({ id: created._id.toString() });
    }

    const idCheck = objectIdSchema.safeParse(id);
    if (!idCheck.success) return fail('Invalid collection id.');
    const existing = await getCollectionById(idCheck.data);
    if (!existing) return fail('Collection not found.');
    await updateCollection(idCheck.data, parsed.data);
    await audit(actor, 'collection.updated', 'collection', idCheck.data, { slug: parsed.data.slug, name: parsed.data.name });
    revalidateCatalogNav();
    revalidatePath(`/collections/${existing.slug}`);
    return ok({ id: idCheck.data });
  });
}

export async function deleteCollection(collectionId: string): Promise<AdminActionResult> {
  return runAdminAction('admin', async (actor) => {
    const idCheck = objectIdSchema.safeParse(collectionId);
    if (!idCheck.success) return fail('Invalid request.');
    const existing = await getCollectionById(idCheck.data);
    if (!existing) return fail('Collection not found.');
    const inUse = await countProductsReferencing('collectionIds', idCheck.data);
    if (inUse > 0) throw new CatalogError(`${inUse} product(s) are still in this collection. Remove them first.`);
    await deleteCollectionDoc(idCheck.data);
    await audit(actor, 'collection.deleted', 'collection', idCheck.data, { slug: existing.slug, name: existing.name });
    revalidateCatalogNav();
    return ok();
  });
}
