import { ObjectId } from 'mongodb';
import { reviews, orders } from '@/lib/db/collections';
import type { Review } from '@/types/domain';
import type { ReviewInput } from '@/lib/validation/review';

export async function listApprovedReviews(productId: string): Promise<Review[]> {
  if (!ObjectId.isValid(productId)) return [];
  const col = await reviews();
  return col.find({ productId: new ObjectId(productId), status: 'approved' }).sort({ createdAt: -1 }).toArray();
}

export async function listReviewsForAdmin(status?: Review['status']): Promise<Review[]> {
  const col = await reviews();
  const filter = status ? { status } : {};
  return col.find(filter).sort({ createdAt: -1 }).toArray();
}

async function hasVerifiedPurchase(productId: ObjectId, customerId: ObjectId | null): Promise<boolean> {
  if (!customerId) return false;
  const col = await orders();
  const match = await col.findOne({
    customerId,
    'items.productId': productId,
    fulfillmentStatus: { $in: ['delivered'] },
  });
  return Boolean(match);
}

export async function createReview(input: ReviewInput, customerId: string | null): Promise<Review> {
  const col = await reviews();
  const productId = new ObjectId(input.productId);
  const custId = customerId ? new ObjectId(customerId) : null;
  const verified = await hasVerifiedPurchase(productId, custId);

  const now = new Date();
  const doc: Omit<Review, '_id'> = {
    productId,
    customerId: custId,
    customerName: input.customerName,
    rating: input.rating,
    title: input.title,
    body: input.body,
    verifiedPurchase: verified,
    status: 'pending',
    createdAt: now,
  };
  const result = await col.insertOne(doc as Review);
  return { ...doc, _id: result.insertedId } as Review;
}

export async function moderateReview(id: string, status: 'approved' | 'rejected'): Promise<void> {
  const col = await reviews();
  await col.updateOne({ _id: new ObjectId(id) }, { $set: { status } });
}
