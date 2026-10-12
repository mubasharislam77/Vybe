'use server';

import { revalidatePath } from 'next/cache';
import { productInputSchema } from '@/lib/validation/product';
import { objectIdSchema } from '@/lib/validation/common';
import { createProductFromInput, updateProductFromInput } from '@/lib/services/admin-product.service';
import { deleteProduct as deleteProductDoc, getProductById, updateProduct } from '@/lib/repositories/products.repo';
import { runAdminAction, audit, fail, ok, firstIssue, type AdminActionResult } from './_shared';

/** Storefront surfaces that render catalog data — invalidated on any product change. */
function revalidateCatalog(slug?: string) {
  revalidatePath('/');
  revalidatePath('/shop');
  revalidatePath('/new-arrivals');
  revalidatePath('/best-sellers');
  revalidatePath('/sale');
  revalidatePath('/search');
  revalidatePath('/category/[slug]', 'page');
  revalidatePath('/collections/[slug]', 'page');
  if (slug) revalidatePath(`/products/${slug}`);
  revalidatePath('/admin');
  revalidatePath('/admin/products');
}

export async function saveProduct(
  id: string | null,
  rawInput: unknown,
): Promise<AdminActionResult<{ id: string; slug: string }>> {
  return runAdminAction('staff', async (actor) => {
    const parsed = productInputSchema.safeParse(rawInput);
    if (!parsed.success) return fail(firstIssue(parsed.error));

    if (id === null) {
      const created = await createProductFromInput(parsed.data);
      await audit(actor, 'product.created', 'product', created._id.toString(), { slug: created.slug, title: created.title });
      revalidateCatalog(created.slug);
      return ok({ id: created._id.toString(), slug: created.slug });
    }

    const idCheck = objectIdSchema.safeParse(id);
    if (!idCheck.success) return fail('Invalid product id.');
    const before = await getProductById(idCheck.data);
    if (!before) return fail('Product not found.');

    const updated = await updateProductFromInput(idCheck.data, parsed.data);
    await audit(actor, 'product.updated', 'product', idCheck.data, {
      slug: updated.slug,
      title: updated.title,
      status: before.status !== updated.status ? { from: before.status, to: updated.status } : undefined,
      variants: updated.variants.length,
    });
    revalidateCatalog(before.slug);
    if (before.slug !== updated.slug) revalidateCatalog(updated.slug);
    revalidatePath(`/admin/products/${idCheck.data}/edit`);
    return ok({ id: idCheck.data, slug: updated.slug });
  });
}

export async function setProductStatus(productId: string, status: 'draft' | 'published'): Promise<AdminActionResult> {
  return runAdminAction('staff', async (actor) => {
    const idCheck = objectIdSchema.safeParse(productId);
    if (!idCheck.success || (status !== 'draft' && status !== 'published')) return fail('Invalid request.');
    const product = await getProductById(idCheck.data);
    if (!product) return fail('Product not found.');
    if (product.status === status) return ok();
    await updateProduct(idCheck.data, { status });
    await audit(actor, status === 'published' ? 'product.published' : 'product.unpublished', 'product', idCheck.data, {
      slug: product.slug,
    });
    revalidateCatalog(product.slug);
    return ok();
  });
}

export async function setProductFeatured(productId: string, featured: boolean): Promise<AdminActionResult> {
  return runAdminAction('staff', async (actor) => {
    const idCheck = objectIdSchema.safeParse(productId);
    if (!idCheck.success) return fail('Invalid request.');
    const product = await getProductById(idCheck.data);
    if (!product) return fail('Product not found.');
    await updateProduct(idCheck.data, { featured: Boolean(featured) });
    await audit(actor, 'product.featured', 'product', idCheck.data, { slug: product.slug, featured: Boolean(featured) });
    revalidateCatalog(product.slug);
    return ok();
  });
}

/**
 * Hard delete, admin-only. Safe for order history because each order line
 * snapshots title/sku/price at purchase time and never re-reads the
 * product. Prefer unpublishing for anything that has sold — deleting
 * loses the sales counter and any pending reviews' context.
 */
export async function deleteProduct(productId: string): Promise<AdminActionResult> {
  return runAdminAction('admin', async (actor) => {
    const idCheck = objectIdSchema.safeParse(productId);
    if (!idCheck.success) return fail('Invalid request.');
    const product = await getProductById(idCheck.data);
    if (!product) return fail('Product not found.');
    await deleteProductDoc(idCheck.data);
    await audit(actor, 'product.deleted', 'product', idCheck.data, { slug: product.slug, title: product.title });
    revalidateCatalog(product.slug);
    return ok();
  });
}
