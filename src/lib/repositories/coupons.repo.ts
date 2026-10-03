import { ObjectId, type ClientSession } from 'mongodb';
import { coupons } from '@/lib/db/collections';
import type { Coupon } from '@/types/domain';
import type { CouponInput } from '@/lib/validation/coupon';

export async function getCouponByCode(code: string, session?: ClientSession): Promise<Coupon | null> {
  const col = await coupons();
  return col.findOne({ code: code.toUpperCase() }, { session });
}

export async function listCouponsForAdmin(): Promise<Coupon[]> {
  const col = await coupons();
  return col.find({}).sort({ createdAt: -1 }).toArray();
}

export async function createCoupon(input: CouponInput): Promise<Coupon> {
  const col = await coupons();
  const now = new Date();
  const doc: Omit<Coupon, '_id'> = {
    code: input.code,
    type: input.type,
    value: input.value,
    minSpendMinor: input.minSpendMinor,
    usageLimit: input.usageLimit,
    usageCount: 0,
    perCustomerLimit: input.perCustomerLimit,
    startsAt: input.startsAt,
    expiresAt: input.expiresAt,
    active: input.active,
    createdAt: now,
    updatedAt: now,
  };
  const result = await col.insertOne(doc as Coupon);
  return { ...doc, _id: result.insertedId } as Coupon;
}

export async function updateCoupon(id: string, input: CouponInput): Promise<void> {
  const col = await coupons();
  await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        code: input.code,
        type: input.type,
        value: input.value,
        minSpendMinor: input.minSpendMinor,
        usageLimit: input.usageLimit,
        perCustomerLimit: input.perCustomerLimit,
        startsAt: input.startsAt,
        expiresAt: input.expiresAt,
        active: input.active,
        updatedAt: new Date(),
      },
    },
  );
}

/**
 * Atomically claims one use of a coupon inside the checkout transaction:
 * only succeeds if the coupon is still active, within its date window, and
 * under its usage limit at the moment of the write — the same conditional-
 * update pattern as stock decrement, so concurrent checkouts can't both
 * succeed past the limit.
 */
export async function incrementCouponUsage(
  code: string,
  session: ClientSession,
): Promise<boolean> {
  const col = await coupons();
  const now = new Date();
  const result = await col.updateOne(
    {
      code: code.toUpperCase(),
      active: true,
      $and: [
        { $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: now } }] },
        { $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gte: now } }] },
        { $or: [{ usageLimit: { $exists: false } }, { $expr: { $lt: ['$usageCount', '$usageLimit'] } }] },
      ],
    },
    { $inc: { usageCount: 1 }, $set: { updatedAt: now } },
    { session },
  );
  return result.modifiedCount === 1;
}

export async function decrementCouponUsage(code: string, session?: ClientSession): Promise<void> {
  const col = await coupons();
  await col.updateOne({ code: code.toUpperCase() }, { $inc: { usageCount: -1 } }, { session });
}
