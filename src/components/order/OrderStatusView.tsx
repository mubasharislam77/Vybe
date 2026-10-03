import type { Order, FulfillmentStatus } from '@/types/domain';
import { formatPKR } from '@/lib/utils/money';
import { Badge } from '@/components/ui/Badge';
import { BankTransferProofUpload } from './BankTransferProofUpload';

const STEPS: FulfillmentStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STEP_LABEL: Record<FulfillmentStatus, string> = {
  pending: 'Order placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export function OrderStatusView({ order, bankInstructions }: { order: Order; bankInstructions?: string }) {
  const isTerminalOutlier = order.fulfillmentStatus === 'cancelled' || order.fulfillmentStatus === 'returned';
  const currentStepIndex = STEPS.indexOf(order.fulfillmentStatus);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="text-sm text-ink-400">Order</p>
        <h1 className="font-display text-3xl uppercase tracking-tight text-ink">{order.orderNumber}</h1>
        <p className="mt-1 text-sm text-ink-600">
          Placed{' '}
          {new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Karachi' }).format(
            order.placedAt,
          )}
        </p>
      </div>

      {isTerminalOutlier ? (
        <Badge tone={order.fulfillmentStatus === 'cancelled' ? 'burgundy' : 'outline'}>
          {STEP_LABEL[order.fulfillmentStatus]}
        </Badge>
      ) : (
        <ol className="flex flex-wrap gap-4" aria-label="Order progress">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                  i <= currentStepIndex ? 'bg-ink text-ivory' : 'bg-ink/10 text-ink-400'
                }`}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className={`text-sm ${i <= currentStepIndex ? 'text-ink' : 'text-ink-400'}`}>
                {STEP_LABEL[step]}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div>
        <h2 className="mb-4 font-display text-sm uppercase tracking-widest2 text-ink">Items</h2>
        <ul className="flex flex-col divide-y divide-ink/10">
          {order.items.map((item) => (
            <li key={item.sku} className="flex justify-between gap-4 py-3 text-sm">
              <span>
                {item.title} × {item.quantity}
                <span className="block text-xs text-ink-400">
                  {item.size} / {item.colorName} · SKU {item.sku}
                </span>
              </span>
              <span className="shrink-0">{formatPKR(item.lineTotalMinor)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-col gap-1 border-t border-ink/10 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-600">Subtotal</span>
            <span>{formatPKR(order.subtotalMinor)}</span>
          </div>
          {order.discountMinor > 0 && (
            <div className="flex justify-between text-burgundy">
              <span>Discount{order.coupon ? ` (${order.coupon.code})` : ''}</span>
              <span>−{formatPKR(order.discountMinor)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-ink-600">Shipping</span>
            <span>{formatPKR(order.shippingMinor)}</span>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-2 font-medium">
            <span>Total</span>
            <span>{formatPKR(order.totalMinor)}</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-display text-sm uppercase tracking-widest2 text-ink">Delivery Address</h2>
        <p className="text-sm text-ink-600">
          {order.shipping.fullName}
          <br />
          {order.shipping.addressLine}, {order.shipping.city}, {order.shipping.province}
          {order.shipping.postalCode ? ` ${order.shipping.postalCode}` : ''}
          <br />
          {order.shipping.phoneE164}
        </p>
      </div>

      <div>
        <h2 className="mb-2 font-display text-sm uppercase tracking-widest2 text-ink">Payment</h2>
        <p className="text-sm text-ink-600">
          {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Bank transfer'} — {order.paymentStatus.replace('_', ' ')}
        </p>
        {order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'pending' && (
          <div className="mt-4">
            <BankTransferProofUpload
              orderNumber={order.orderNumber}
              trackingToken={order.trackingToken}
              bankInstructions={bankInstructions}
            />
          </div>
        )}
      </div>

      <p className="text-xs text-ink-400">
        Bookmark this page to check your order status later — it&apos;s accessible only with this private link.
      </p>
    </div>
  );
}
