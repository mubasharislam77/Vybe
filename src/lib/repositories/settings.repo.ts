import { storeSettings } from '@/lib/db/collections';
import type { StoreSettings } from '@/types/domain';
import { toSetUnset } from '@/lib/db/update';

const DEFAULT_SETTINGS: Omit<StoreSettings, '_id' | 'updatedAt'> = {
  storeName: 'VybeTheBrand',
  contactPhoneE164: '',
  contactEmail: '',
  whatsappSupportNumberE164: '',
  socialLinks: [],
  shippingZones: [],
  defaultShippingFeeMinor: 25000, // PKR 250 flat, until an admin configures zones
  freeShippingThresholdMinor: undefined,
  bankTransferInstructions: '',
};

/** Singleton settings doc — created with sane defaults on first read if missing. */
export async function getStoreSettings(): Promise<StoreSettings> {
  const col = await storeSettings();
  const existing = await col.findOne({});
  if (existing) return existing;

  const now = new Date();
  const doc = { ...DEFAULT_SETTINGS, updatedAt: now };
  const result = await col.insertOne(doc as StoreSettings);
  return { ...doc, _id: result.insertedId } as StoreSettings;
}

export async function updateStoreSettings(update: Partial<Omit<StoreSettings, '_id'>>): Promise<void> {
  const col = await storeSettings();
  const existing = await getStoreSettings();
  await col.updateOne({ _id: existing._id }, toSetUnset<StoreSettings>({ ...update, updatedAt: new Date() }));
}

/**
 * Shipping fee + COD eligibility for a delivery city. Cities not covered by
 * any configured zone fall back to the flat default fee and are treated as
 * COD-eligible — zones are an override list for areas that need a
 * different fee or that are courier/bank-transfer-only, not an allowlist.
 */
export function resolveShipping(
  settings: StoreSettings,
  city: string,
  subtotalAfterDiscountMinor: number,
): { feeMinor: number; codEligible: boolean } {
  const zone = settings.shippingZones.find((z) =>
    z.cities.some((c) => c.toLowerCase() === city.toLowerCase()),
  );
  // `typeof` rather than `!== undefined`: documents written before
  // ignoreUndefined was set may carry an explicit null here, and
  // `subtotal >= null` is true in JS — which would make shipping free for all.
  const feeMinor =
    typeof settings.freeShippingThresholdMinor === 'number' &&
    subtotalAfterDiscountMinor >= settings.freeShippingThresholdMinor
      ? 0
      : zone?.feeMinor ?? settings.defaultShippingFeeMinor;
  return { feeMinor, codEligible: zone?.codEligible ?? true };
}
