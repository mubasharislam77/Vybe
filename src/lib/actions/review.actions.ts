'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { reviewInputSchema } from '@/lib/validation/review';
import { createReview } from '@/lib/repositories/reviews.repo';
import { getProductById } from '@/lib/repositories/products.repo';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/rate-limit/limiter';

export interface SubmitReviewResult {
  success: boolean;
  errorMessage?: string;
}

export async function submitReview(rawInput: unknown): Promise<SubmitReviewResult> {
  const headerList = await headers();
  const ip = clientIpFromHeaders(headerList);
  const { allowed } = await checkRateLimit(`review:${ip}`, 5, 60_000);
  if (!allowed) {
    return { success: false, errorMessage: 'Too many submissions — please wait a moment and try again.' };
  }

  const parsed = reviewInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, errorMessage: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  }

  const product = await getProductById(parsed.data.productId);
  if (!product) {
    return { success: false, errorMessage: 'Product not found.' };
  }

  const session = await auth();
  const customerId = session?.user?.role === 'customer' ? session.user.id : null;

  await createReview(parsed.data, customerId);
  revalidatePath(`/products/${product.slug}`);

  return { success: true };
}
