'use server';

import { auth } from '@/auth';
import { createSignedUploadParams, isCloudinaryConfigured } from '@/lib/media/cloudinary';

export interface SignedUploadResult {
  configured: boolean;
  params?: ReturnType<typeof createSignedUploadParams>;
}

/** Bank-transfer proof uploads: any signed-in-or-not customer with an order can upload — scoped by folder, not by role. */
export async function getBankProofUploadParams(): Promise<SignedUploadResult> {
  if (!isCloudinaryConfigured()) return { configured: false };
  return { configured: true, params: createSignedUploadParams('vybe/bank-transfer-proofs') };
}

export async function getAdminMediaUploadParams(): Promise<SignedUploadResult> {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
    throw new Error('Unauthorized');
  }
  if (!isCloudinaryConfigured()) return { configured: false };
  return { configured: true, params: createSignedUploadParams('vybe/products') };
}
