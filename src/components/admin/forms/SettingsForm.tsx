'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveStoreSettings } from '@/lib/actions/admin/settings.actions';
import { TextField, TextAreaField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '../FormMessage';
import { inputClass, labelClass, panelPadClass, smallButtonClass } from '../styles';

interface ZoneDraft {
  key: string;
  name: string;
  citiesText: string;
  feeRupees: string;
  codEligible: boolean;
}

interface SocialDraft {
  key: string;
  platform: string;
  url: string;
}

export interface SettingsFormValues {
  storeName: string;
  contactPhoneE164: string;
  contactEmail: string;
  whatsappSupportNumberE164: string;
  socialLinks: { platform: string; url: string }[];
  shippingZones: { name: string; cities: string[]; feeMinor: number; codEligible: boolean }[];
  defaultShippingFeeMinor: number;
  freeShippingThresholdMinor?: number;
  bankTransferInstructions?: string;
}

const key = () => Math.random().toString(36).slice(2, 10);

export function SettingsForm({ initial }: { initial: SettingsFormValues }) {
  const router = useRouter();
  const [storeName, setStoreName] = useState(initial.storeName);
  const [contactPhone, setContactPhone] = useState(initial.contactPhoneE164);
  const [contactEmail, setContactEmail] = useState(initial.contactEmail);
  const [whatsapp, setWhatsapp] = useState(initial.whatsappSupportNumberE164);
  const [socials, setSocials] = useState<SocialDraft[]>(initial.socialLinks.map((s) => ({ key: key(), ...s })));
  const [zones, setZones] = useState<ZoneDraft[]>(
    initial.shippingZones.map((z) => ({
      key: key(),
      name: z.name,
      citiesText: z.cities.join(', '),
      feeRupees: String(z.feeMinor / 100),
      codEligible: z.codEligible,
    })),
  );
  const [defaultFee, setDefaultFee] = useState(String(initial.defaultShippingFeeMinor / 100));
  const [freeThreshold, setFreeThreshold] = useState(
    initial.freeShippingThresholdMinor !== undefined ? String(initial.freeShippingThresholdMinor / 100) : '',
  );
  const [bankInstructions, setBankInstructions] = useState(initial.bankTransferInstructions ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function updateZone(k: string, patch: Partial<ZoneDraft>) {
    setZones((prev) => prev.map((z) => (z.key === k ? { ...z, ...patch } : z)));
  }
  function updateSocial(k: string, patch: Partial<SocialDraft>) {
    setSocials((prev) => prev.map((s) => (s.key === k ? { ...s, ...patch } : s)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const result = await saveStoreSettings({
      storeName,
      contactPhoneE164: contactPhone.trim(),
      contactEmail: contactEmail.trim(),
      whatsappSupportNumberE164: whatsapp.trim(),
      socialLinks: socials.filter((s) => s.platform.trim() || s.url.trim()).map((s) => ({ platform: s.platform.trim(), url: s.url.trim() })),
      shippingZones: zones.map((z) => ({
        name: z.name.trim(),
        cities: z.citiesText.split(',').map((c) => c.trim()).filter(Boolean),
        feeMinor: Math.round((Number(z.feeRupees) || 0) * 100),
        codEligible: z.codEligible,
      })),
      defaultShippingFeeMinor: Math.round((Number(defaultFee) || 0) * 100),
      freeShippingThresholdMinor: freeThreshold.trim() ? Math.round(Number(freeThreshold) * 100) : undefined,
      bankTransferInstructions: bankInstructions.trim() || undefined,
    });
    setSubmitting(false);
    if (!result.success) {
      setError(result.errorMessage ?? 'Could not save settings.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSuccess('Settings saved. Checkout now uses the new shipping rules.');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FormMessage error={error} success={success} />

      <section className={panelPadClass}>
        <h2 className="mb-4 font-display text-sm uppercase tracking-widest2">Store identity &amp; contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Store name" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
          <TextField label="Contact email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          <TextField label="Contact phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+923001234567" hint="International format" />
          <TextField label="WhatsApp support number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+923001234567" hint="Customers are pointed here for payment-proof issues" />
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <p className={labelClass}>Social links</p>
            <button type="button" onClick={() => setSocials((p) => [...p, { key: key(), platform: '', url: '' }])} className={smallButtonClass}>
              + Add link
            </button>
          </div>
          {socials.length === 0 && <p className="text-xs text-ink-400">None yet.</p>}
          <div className="flex flex-col gap-2">
            {socials.map((s) => (
              <div key={s.key} className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                <input value={s.platform} onChange={(e) => updateSocial(s.key, { platform: e.target.value })} placeholder="instagram" className={inputClass} aria-label="Platform" />
                <input type="url" value={s.url} onChange={(e) => updateSocial(s.key, { url: e.target.value })} placeholder="https://instagram.com/…" className={inputClass} aria-label="URL" />
                <button type="button" onClick={() => setSocials((p) => p.filter((x) => x.key !== s.key))} className={`${smallButtonClass} text-burgundy`}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={panelPadClass}>
        <h2 className="mb-1 font-display text-sm uppercase tracking-widest2">Shipping</h2>
        <p className="mb-4 text-xs text-ink-600">
          Cities not listed in any zone pay the default fee and are COD-eligible. Zones override that for specific cities (different fee, or bank-transfer-only).
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Default shipping fee (PKR)" type="number" min={0} step="1" value={defaultFee} onChange={(e) => setDefaultFee(e.target.value)} required />
          <TextField label="Free shipping over (PKR)" type="number" min={1} step="1" value={freeThreshold} onChange={(e) => setFreeThreshold(e.target.value)} hint="Leave blank to never offer free shipping" />
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <p className={labelClass}>Shipping zones</p>
            <button type="button" onClick={() => setZones((p) => [...p, { key: key(), name: '', citiesText: '', feeRupees: '', codEligible: true }])} className={smallButtonClass}>
              + Add zone
            </button>
          </div>
          {zones.length === 0 && <p className="text-xs text-ink-400">No zones — every city uses the default fee.</p>}
          <div className="flex flex-col gap-3">
            {zones.map((z) => (
              <div key={z.key} className="grid gap-2 border border-ink/10 bg-ivory p-3 sm:grid-cols-2 lg:grid-cols-[180px_1fr_120px_auto_auto]">
                <input value={z.name} onChange={(e) => updateZone(z.key, { name: e.target.value })} placeholder="Zone name (e.g. Karachi)" className={inputClass} aria-label="Zone name" required />
                <input value={z.citiesText} onChange={(e) => updateZone(z.key, { citiesText: e.target.value })} placeholder="Cities, comma-separated" className={inputClass} aria-label="Cities" required />
                <input type="number" min={0} step="1" value={z.feeRupees} onChange={(e) => updateZone(z.key, { feeRupees: e.target.value })} placeholder="Fee PKR" className={inputClass} aria-label="Fee in PKR" required />
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={z.codEligible} onChange={(e) => updateZone(z.key, { codEligible: e.target.checked })} className="h-4 w-4 accent-ink" />
                  COD
                </label>
                <button type="button" onClick={() => setZones((p) => p.filter((x) => x.key !== z.key))} className={`${smallButtonClass} text-burgundy`}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={panelPadClass}>
        <h2 className="mb-1 font-display text-sm uppercase tracking-widest2">Bank transfer</h2>
        <p className="mb-4 text-xs text-ink-600">Shown to customers who choose bank transfer, on the confirmation and tracking pages.</p>
        <TextAreaField label="Payment instructions" value={bankInstructions} onChange={(e) => setBankInstructions(e.target.value)} rows={5} maxLength={2000} placeholder={'Bank: …\nAccount title: …\nIBAN: …\nSend the receipt via the upload box or WhatsApp.'} />
      </section>

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </form>
  );
}
