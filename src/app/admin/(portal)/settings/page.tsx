import type { Metadata } from 'next';
import { requireStaffPage } from '@/lib/auth/session';
import { getStoreSettings } from '@/lib/repositories/settings.repo';
import { formatDateTime } from '@/lib/utils/dates';
import { PageHeader } from '@/components/admin/PageHeader';
import { SettingsForm } from '@/components/admin/forms/SettingsForm';

export const metadata: Metadata = { title: 'Store settings' };

export default async function AdminSettingsPage() {
  await requireStaffPage('admin');
  const settings = await getStoreSettings();

  return (
    <>
      <PageHeader title="Store settings" description={`Shipping rules apply to the next checkout immediately. Last saved ${formatDateTime(settings.updatedAt)}.`} />
      <SettingsForm
        initial={{
          storeName: settings.storeName,
          contactPhoneE164: settings.contactPhoneE164,
          contactEmail: settings.contactEmail,
          whatsappSupportNumberE164: settings.whatsappSupportNumberE164,
          socialLinks: settings.socialLinks,
          shippingZones: settings.shippingZones,
          defaultShippingFeeMinor: settings.defaultShippingFeeMinor,
          freeShippingThresholdMinor: settings.freeShippingThresholdMinor ?? undefined,
          bankTransferInstructions: settings.bankTransferInstructions,
        }}
      />
    </>
  );
}
