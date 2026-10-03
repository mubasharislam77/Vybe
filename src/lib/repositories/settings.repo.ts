import { storeSettings } from '@/lib/db/collections';
import type { StoreSettings } from '@/types/domain';

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
  await col.updateOne({ _id: existing._id }, { $set: { ...update, updatedAt: new Date() } });
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
  const feeMinor =
    settings.freeShippingThresholdMinor !== undefined &&
    subtotalAfterDiscountMinor >= settings.freeShippingThresholdMinor
      ? 0
      : zone?.feeMinor ?? settings.defaultShippingFeeMinor;
  return { feeMinor, codEligible: zone?.codEligible ?? true };
}
