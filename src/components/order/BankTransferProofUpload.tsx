'use client';

import { useState } from 'react';
import { getBankProofUploadParams } from '@/lib/actions/media.actions';
import { submitBankTransferProof } from '@/lib/actions/order.actions';
import { Button } from '@/components/ui/Button';

export function BankTransferProofUpload({
  orderNumber,
  trackingToken,
  bankInstructions,
}: {
  orderNumber: string;
  trackingToken: string;
  bankInstructions?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error' | 'unconfigured'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setErrorMessage(null);

    const signed = await getBankProofUploadParams();
    if (!signed.configured || !signed.params) {
      setStatus('unconfigured');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signed.params.apiKey);
      formData.append('timestamp', String(signed.params.timestamp));
      formData.append('signature', signed.params.signature);
      formData.append('folder', signed.params.folder);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signed.params.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson?.error?.message ?? 'Upload failed');

      const result = await submitBankTransferProof({
        orderNumber,
        trackingToken,
        proofUrl: uploadJson.secure_url,
        proofPublicId: uploadJson.public_id,
      });
      if (!result.success) throw new Error(result.errorMessage ?? 'Could not save proof');

      setStatus('done');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed');
    }
  }

  if (status === 'done') {
    return (
      <p role="status" className="text-sm text-ink-600">
        Thanks — we&apos;ve received your payment proof and will verify it shortly.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 border border-ink/10 p-4">
      <p className="text-sm font-medium text-ink">Submit bank transfer proof</p>
      {bankInstructions && <p className="whitespace-pre-line text-sm text-ink-600">{bankInstructions}</p>}

      {status === 'unconfigured' ? (
        <p className="text-sm text-burgundy">
          Upload isn&apos;t available right now — please message us on WhatsApp with a screenshot of your transfer
          instead.
        </p>
      ) : (
        <>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          {errorMessage && (
            <p role="alert" className="text-sm text-burgundy">
              {errorMessage}
            </p>
          )}
          <Button variant="secondary" size="sm" onClick={handleUpload} disabled={!file || status === 'uploading'}>
            {status === 'uploading' ? 'Uploading…' : 'Upload Proof'}
          </Button>
        </>
      )}
    </div>
  );
}
