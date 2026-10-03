import type { Order } from '@/types/domain';
import { releaseStock } from './inventory.service';
import { decrementCouponUsage } from '@/lib/repositories/coupons.repo';

/** Order never fulfilled: stock comes back AND the coupon use is refunded. */
export async function compensateCancelledOrder(order: Order): Promise<void> {
  await releaseOrderStock(order);
  if (order.coupon) {
    await decrementCouponUsage(order.coupon.code);
  }
}

/** Order was fulfilled then returned: stock comes back, but the coupon use stands — the sale happened. */
export async function releaseOrderStock(order: Order): Promise<void> {
  for (const item of order.items) {
    if (item.fulfillment === 'ready_stock') {
      await releaseStock(item.sku, item.quantity);
    }
  }
}
