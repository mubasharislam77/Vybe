'use server';

import { revalidatePath } from 'next/cache';
import { storeSettingsSchema } from '@/lib/validation/admin';
import { getStoreSettings, updateStoreSettings } from '@/lib/repositories/settings.repo';
import { runAdminAction, audit, fail, ok, firstIssue, type AdminActionResult } from './_shared';

export async function saveStoreSettings(rawInput: unknown): Promise<AdminActionResult> {
  return runAdminAction('admin', async (actor) => {
    const parsed = storeSettingsSchema.safeParse(rawInput);
    if (!parsed.success) return fail(firstIssue(parsed.error));

    const before = await getStoreSettings();
    await updateStoreSettings({
      storeName: parsed.data.storeName,
      contactPhoneE164: parsed.data.contactPhoneE164,
      contactEmail: parsed.data.contactEmail,
      whatsappSupportNumberE164: parsed.data.whatsappSupportNumberE164,
      socialLinks: parsed.data.socialLinks,
      shippingZones: parsed.data.shippingZones.map((z) => ({ ...z, cities: z.cities.map((c) => c.trim()).filter(Boolean) })),
      defaultShippingFeeMinor: parsed.data.defaultShippingFeeMinor,
      freeShippingThresholdMinor: parsed.data.freeShippingThresholdMinor,
      bankTransferInstructions: parsed.data.bankTransferInstructions ?? '',
    });
    await audit(actor, 'settings.updated', 'settings', before._id.toString(), {
      defaultShippingFeeMinor: { from: before.defaultShippingFeeMinor, to: parsed.data.defaultShippingFeeMinor },
      freeShippingThresholdMinor: { from: before.freeShippingThresholdMinor ?? null, to: parsed.data.freeShippingThresholdMinor ?? null },
      shippingZones: parsed.data.shippingZones.length,
    });
    revalidatePath('/admin/settings');
    revalidatePath('/checkout');
    revalidatePath('/', 'layout');
    return ok();
  });
}
