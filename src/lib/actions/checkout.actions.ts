'use server';

import { headers } from 'next/headers';
import { auth } from '@/auth';
import { checkoutInputSchema } from '@/lib/validation/checkout';
import { placeOrder, CheckoutError } from '@/lib/services/checkout.service';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/rate-limit/limiter';
import { formatPKR } from '@/lib/utils/money';
import { drainNotificationOutbox } from '@/lib/notifications/drain';

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

    // Send the order notification right here, in the same request as
    // checkout — straightforward and easy to reason about. The order
    // itself is already durably saved before this runs, so a transient
    // email failure here never loses the order or makes a successful
    // checkout look failed to the customer (caught separately below,
    // never thrown back into the outer catch). The outbox row written by
    // placeOrder still exists either way, so nothing is lost even if this
    // fails — it's just not retried automatically without the cron sweep.
    try {
      await drainNotificationOutbox(5);
    } catch (notifyErr) {
      console.error('Order notification send failed (order still placed successfully):', notifyErr);
    }

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
