import { ObjectId } from 'mongodb';
import { getMongoClient } from '@/lib/db/client';
import type { CheckoutInput } from '@/lib/validation/checkout';
import type { Order, OrderLineItem } from '@/types/domain';
import { getProductByVariantSku } from '@/lib/repositories/products.repo';
import { claimStock, releaseStock, incrementSalesCounts } from '@/lib/services/inventory.service';
import { getCouponByCode, incrementCouponUsage, decrementCouponUsage } from '@/lib/repositories/coupons.repo';
import { getStoreSettings, resolveShipping } from '@/lib/repositories/settings.repo';
import { insertOrder, findOrderByIdempotencyKey } from '@/lib/repositories/orders.repo';
import { enqueueWhatsAppNotification } from '@/lib/repositories/notifications.repo';
import { generateOrderNumber, generateTrackingToken } from '@/lib/utils/ids';
import { percentOf } from '@/lib/utils/money';
import { buildOrderNotificationSummary } from '@/lib/notifications/whatsapp/templates';

export class CheckoutError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export async function placeOrder(
  input: CheckoutInput,
  customerId: string | null,
): Promise<{ order: Order; replayed: boolean }> {
  const existing = await findOrderByIdempotencyKey(input.idempotencyKey);
  if (existing) {
    return { order: existing, replayed: true };
  }

  const client = await getMongoClient();
  const session = client.startSession();
  let createdOrder: Order | null = null;

  try {
    await session.withTransaction(async () => {
      const items: OrderLineItem[] = [];
      let subtotalMinor = 0;

      for (const line of input.items) {
        const product = await getProductByVariantSku(line.sku, session);
        if (!product) {
          throw new CheckoutError('product_unavailable', `${line.sku} is no longer available`);
        }
        const variant = product.variants.find((v) => v.sku === line.sku);
        if (!variant) {
          throw new CheckoutError('product_unavailable', `${line.sku} is no longer available`);
        }

        if (product.fulfillment === 'ready_stock') {
          const claimed = await claimStock(line.sku, line.quantity, session);
          if (!claimed) {
            throw new CheckoutError('out_of_stock', `Only limited stock left for ${product.title} (${variant.size}/${variant.colorName})`);
          }
        }

        const lineTotalMinor = variant.priceMinor * line.quantity;
        subtotalMinor += lineTotalMinor;

        items.push({
          productId: product._id,
          productSlug: product.slug,
          title: product.title,
          sku: variant.sku,
          size: variant.size,
          colorName: variant.colorName,
          imageUrl: variant.images[0]?.url ?? product.images[0]?.url,
          unitPriceMinor: variant.priceMinor,
          quantity: line.quantity,
          lineTotalMinor,
          fulfillment: product.fulfillment,
          productionLeadTimeDays: product.productionLeadTimeDays,
        });
      }

      let discountMinor = 0;
      let appliedCoupon: Order['coupon'] | undefined;
      if (input.couponCode) {
        const coupon = await getCouponByCode(input.couponCode, session);
        if (!coupon) {
          throw new CheckoutError('invalid_coupon', 'This coupon code is not valid');
        }
        if (coupon.minSpendMinor && subtotalMinor < coupon.minSpendMinor) {
          throw new CheckoutError('coupon_min_spend', `This coupon requires a minimum order of the configured amount`);
        }
        const claimed = await incrementCouponUsage(input.couponCode, session);
        if (!claimed) {
          throw new CheckoutError('coupon_unavailable', 'This coupon is no longer available');
        }
        discountMinor =
          coupon.type === 'percent' ? percentOf(subtotalMinor, coupon.value) : Math.min(coupon.value, subtotalMinor);
        appliedCoupon = { code: coupon.code, discountMinor };
      }

      const settings = await getStoreSettings();
      const { feeMinor: shippingMinor, codEligible } = resolveShipping(
        settings,
        input.shipping.city,
        subtotalMinor - discountMinor,
      );
      if (input.paymentMethod === 'cod' && !codEligible) {
        throw new CheckoutError('cod_ineligible', 'Cash on delivery is not available for this city — please choose bank transfer');
      }

      const totalMinor = subtotalMinor - discountMinor + shippingMinor;
      const now = new Date();
      const orderNumber = generateOrderNumber();
      const trackingToken = generateTrackingToken();

      const orderDoc: Omit<Order, '_id'> = {
        orderNumber,
        trackingToken,
        customerId: customerId ? new ObjectId(customerId) : null,
        idempotencyKey: input.idempotencyKey,
        items,
        subtotalMinor,
        discountMinor,
        shippingMinor,
        totalMinor,
        coupon: appliedCoupon,
        shipping: input.shipping,
        notes: input.notes,
        paymentMethod: input.paymentMethod,
        paymentStatus: 'pending',
        fulfillmentStatus: 'pending',
        statusHistory: [{ status: 'pending', at: now, by: 'system' }],
        placedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      createdOrder = await insertOrder(orderDoc, session);

      await incrementSalesCounts(
        items.map((i) => ({ sku: i.sku, quantity: i.quantity })),
        session,
      );

      await enqueueWhatsAppNotification(
        createdOrder._id,
        orderNumber,
        buildOrderNotificationSummary(createdOrder),
        session,
      );
    });

    if (!createdOrder) {
      throw new CheckoutError('unknown', 'Order could not be created');
    }
    return { order: createdOrder, replayed: false };
  } catch (err) {
    // Transaction aborted (or threw before commit) — Mongo automatically rolls
    // back every write performed inside the callback for this attempt
    // (stock decrements, coupon increment, order insert), so there is
    // nothing to manually compensate here.
    if (err instanceof CheckoutError) throw err;

    // Duplicate idempotency key race: another request with the same key
    // committed first. Return that order instead of surfacing an error.
    if (isDuplicateKeyError(err)) {
      const raced = await findOrderByIdempotencyKey(input.idempotencyKey);
      if (raced) return { order: raced, replayed: true };
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

function isDuplicateKeyError(err: unknown): boolean {
  return Boolean(err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000);
}

export async function compensateCancelledOrder(order: Order): Promise<void> {
  for (const item of order.items) {
    if (item.fulfillment === 'ready_stock') {
      await releaseStock(item.sku, item.quantity);
    }
  }
  if (order.coupon) {
    await decrementCouponUsage(order.coupon.code);
  }
}
