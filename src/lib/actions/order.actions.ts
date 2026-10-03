'use server';

import { revalidatePath } from 'next/cache';
import { bankTransferProofSchema } from '@/lib/validation/checkout';
import { findOrderByTrackingToken } from '@/lib/repositories/orders.repo';
import { attachBankTransferProof } from '@/lib/repositories/orders.repo';

export interface SubmitProofResult {
  success: boolean;
  errorMessage?: string;
}

export async function submitBankTransferProof(rawInput: unknown): Promise<SubmitProofResult> {
  const parsed = bankTransferProofSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, errorMessage: 'Invalid submission.' };
  }

  const order = await findOrderByTrackingToken(parsed.data.orderNumber, parsed.data.trackingToken);
  if (!order) {
    return { success: false, errorMessage: 'Order not found.' };
  }
  if (order.paymentMethod !== 'bank_transfer') {
    return { success: false, errorMessage: 'This order is not paid by bank transfer.' };
  }

  await attachBankTransferProof(order._id.toString(), {
    url: parsed.data.proofUrl,
    publicId: parsed.data.proofPublicId,
  });

  revalidatePath(`/track-order/${order.orderNumber}`);
  return { success: true };
}
