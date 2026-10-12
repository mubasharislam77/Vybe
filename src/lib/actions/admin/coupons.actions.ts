'use server';

import { revalidatePath } from 'next/cache';
import { couponInputSchema } from '@/lib/validation/coupon';
import { objectIdSchema } from '@/lib/validation/common';
import {
  createCoupon,
  deleteCoupon as deleteCouponDoc,
  getCouponByCode,
  getCouponById,
  setCouponActive as setCouponActiveDoc,
  updateCoupon,
} from '@/lib/repositories/coupons.repo';
import { runAdminAction, audit, fail, ok, firstIssue, type AdminActionResult } from './_shared';

export async function saveCoupon(id: string | null, rawInput: unknown): Promise<AdminActionResult<{ id: string }>> {
  return runAdminAction('staff', async (actor) => {
    const parsed = couponInputSchema.safeParse(rawInput);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    if (parsed.data.startsAt && parsed.data.expiresAt && parsed.data.expiresAt < parsed.data.startsAt) {
      return fail('Expiry must be after the start date.');
    }

    const codeOwner = await getCouponByCode(parsed.data.code);
    if (codeOwner && codeOwner._id.toString() !== id) return fail('A coupon with this code already exists.');

    if (id === null) {
      const created = await createCoupon(parsed.data);
      await audit(actor, 'coupon.created', 'coupon', created._id.toString(), { code: created.code, type: created.type, value: created.value });
      revalidatePath('/admin/coupons');
      return ok({ id: created._id.toString() });
    }

    const idCheck = objectIdSchema.safeParse(id);
    if (!idCheck.success) return fail('Invalid coupon id.');
    const existing = await getCouponById(idCheck.data);
    if (!existing) return fail('Coupon not found.');
    await updateCoupon(idCheck.data, parsed.data);
    await audit(actor, 'coupon.updated', 'coupon', idCheck.data, { code: parsed.data.code, type: parsed.data.type, value: parsed.data.value });
    revalidatePath('/admin/coupons');
    return ok({ id: idCheck.data });
  });
}

export async function setCouponActive(couponId: string, active: boolean): Promise<AdminActionResult> {
  return runAdminAction('staff', async (actor) => {
    const idCheck = objectIdSchema.safeParse(couponId);
    if (!idCheck.success) return fail('Invalid request.');
    const existing = await getCouponById(idCheck.data);
    if (!existing) return fail('Coupon not found.');
    await setCouponActiveDoc(idCheck.data, Boolean(active));
    await audit(actor, active ? 'coupon.activated' : 'coupon.deactivated', 'coupon', idCheck.data, { code: existing.code });
    revalidatePath('/admin/coupons');
    return ok();
  });
}

export async function deleteCoupon(couponId: string): Promise<AdminActionResult> {
  return runAdminAction('admin', async (actor) => {
    const idCheck = objectIdSchema.safeParse(couponId);
    if (!idCheck.success) return fail('Invalid request.');
    const existing = await getCouponById(idCheck.data);
    if (!existing) return fail('Coupon not found.');
    if (existing.usageCount > 0) {
      return fail('This coupon has been used on orders — deactivate it instead so order history keeps its reference.');
    }
    await deleteCouponDoc(idCheck.data);
    await audit(actor, 'coupon.deleted', 'coupon', idCheck.data, { code: existing.code });
    revalidatePath('/admin/coupons');
    return ok();
  });
}
