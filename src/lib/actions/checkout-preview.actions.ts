'use server';

import { z } from 'zod';
import { resolveCartView } from '@/lib/services/cart.service';
import { getCouponByCode } from '@/lib/repositories/coupons.repo';
import { getStoreSettings, resolveShipping } from '@/lib/repositories/settings.repo';
import { percentOf } from '@/lib/utils/money';
import type { CartItem } from '@/types/domain';

const inputSchema = z.object({
  items: z.array(z.object({ sku: z.string().min(1), quantity: z.number().int().positive().max(20) })).max(50),
  city: z.string().trim().optional(),
  couponCode: z.string().trim().optional(),
});

export interface CheckoutPreview {
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number | null;
  totalMinor: number | null;
  codEligible: boolean;
  couponError: string | null;
  unavailableSkus: string[];
}

/**
 * Non-mutating preview for the checkout page's running total — reads the
 * same current catalog/settings data the real transaction will, but never
 * claims stock or coupon usage. The actual order still fully re-validates
 * everything itself; this is purely so the UI isn't guessing.
 */
export async function previewCheckoutTotals(raw: {
  items: CartItem[];
  city?: string;
  couponCode?: string;
}): Promise<CheckoutPreview> {
  const parsed = inputSchema.parse(raw);
  const lines = await resolveCartView(parsed.items);
  const unavailableSkus = lines.filter((l) => !l.available).map((l) => l.sku);
  const subtotalMinor = lines.reduce((sum, l) => sum + l.lineTotalMinor, 0);

  let discountMinor = 0;
  let couponError: string | null = null;
  if (parsed.couponCode) {
    const coupon = await getCouponByCode(parsed.couponCode);
    if (!coupon || !coupon.active) {
      couponError = 'This coupon code is not valid.';
    } else if (coupon.minSpendMinor && subtotalMinor < coupon.minSpendMinor) {
      couponError = `Minimum spend not met for this coupon.`;
    } else if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      couponError = 'This coupon has reached its usage limit.';
    } else if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      couponError = 'This coupon has expired.';
    } else {
      discountMinor =
        coupon.type === 'percent' ? percentOf(subtotalMinor, coupon.value) : Math.min(coupon.value, subtotalMinor);
    }
  }

  if (!parsed.city) {
    return {
      subtotalMinor,
      discountMinor,
      shippingMinor: null,
      totalMinor: null,
      codEligible: true,
      couponError,
      unavailableSkus,
    };
  }

  const settings = await getStoreSettings();
  const { feeMinor, codEligible } = resolveShipping(settings, parsed.city, subtotalMinor - discountMinor);

  return {
    subtotalMinor,
    discountMinor,
    shippingMinor: feeMinor,
    totalMinor: subtotalMinor - discountMinor + feeMinor,
    codEligible,
    couponError,
    unavailableSkus,
  };
}
