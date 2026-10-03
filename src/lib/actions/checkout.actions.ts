'use server';

import { headers } from 'next/headers';
import { auth } from '@/auth';
import { checkoutInputSchema } from '@/lib/validation/checkout';
import { placeOrder, CheckoutError } from '@/lib/services/checkout.service';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/rate-limit/limiter';
import { formatPKR } from '@/lib/utils/money';

export interface CheckoutActionResult {
  success: boolean;
  orderNumber?: string;
  trackingToken?: string;
  totalFormatted?: string;
  errorCode?: string;
  errorMessage?: string;
}

export async function submitCheckout(rawInput: unknown): Promise<CheckoutActionResult> {
  const headerList = await headers();
  const ip = clientIpFromHeaders(headerList);
  const { allowed } = await checkRateLimit(`checkout:${ip}`, 10, 60_000);
  if (!allowed) {
    return { success: false, errorCode: 'rate_limited', errorMessage: 'Too many checkout attempts — please wait a moment and try again.' };
  }

  const parsed = checkoutInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      errorCode: 'validation_error',
      errorMessage: parsed.error.issues[0]?.message ?? 'Please check the form and try again.',
    };
  }

  const session = await auth();
  const customerId = session?.user?.role === 'customer' ? session.user.id : null;

  try {
    const { order } = await placeOrder(parsed.data, customerId);
    return {
      success: true,
      orderNumber: order.orderNumber,
      trackingToken: order.trackingToken,
      totalFormatted: formatPKR(order.totalMinor),
    };
  } catch (err) {
    if (err instanceof CheckoutError) {
      return { success: false, errorCode: err.code, errorMessage: err.message };
    }
    throw err;
  }
}
