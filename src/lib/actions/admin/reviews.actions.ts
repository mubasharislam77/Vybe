'use server';

import { revalidatePath } from 'next/cache';
import { reviewModerationSchema } from '@/lib/validation/admin';
import { objectIdSchema } from '@/lib/validation/common';
import { reviews as reviewsCollection } from '@/lib/db/collections';
import { ObjectId } from 'mongodb';
import { deleteReview as deleteReviewDoc, moderateReview as moderateReviewDoc } from '@/lib/repositories/reviews.repo';
import { getProductById } from '@/lib/repositories/products.repo';
import { runAdminAction, audit, fail, ok, type AdminActionResult } from './_shared';

async function revalidateProductPage(productId: ObjectId) {
  const product = await getProductById(productId.toString());
  if (product) revalidatePath(`/products/${product.slug}`);
  revalidatePath('/admin/reviews');
  revalidatePath('/admin');
}

export async function moderateReview(rawInput: unknown): Promise<AdminActionResult> {
  return runAdminAction('staff', async (actor) => {
    const parsed = reviewModerationSchema.safeParse(rawInput);
    if (!parsed.success) return fail('Invalid request.');
    const col = await reviewsCollection();
    const review = await col.findOne({ _id: new ObjectId(parsed.data.id) });
    if (!review) return fail('Review not found.');
    await moderateReviewDoc(parsed.data.id, parsed.data.status);
    await audit(actor, `review.${parsed.data.status}`, 'review', parsed.data.id, {
      productId: review.productId.toString(),
      rating: review.rating,
      from: review.status,
    });
    await revalidateProductPage(review.productId);
    return ok();
  });
}

export async function deleteReview(reviewId: string): Promise<AdminActionResult> {
  return runAdminAction('admin', async (actor) => {
    const idCheck = objectIdSchema.safeParse(reviewId);
    if (!idCheck.success) return fail('Invalid request.');
    const col = await reviewsCollection();
    const review = await col.findOne({ _id: new ObjectId(idCheck.data) });
    if (!review) return fail('Review not found.');
    await deleteReviewDoc(idCheck.data);
    await audit(actor, 'review.deleted', 'review', idCheck.data, { productId: review.productId.toString(), rating: review.rating });
    await revalidateProductPage(review.productId);
    return ok();
  });
}
