'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FulfillmentStatus, PaymentStatus } from '@/types/domain';
import { addOrderNote, resendOrderNotifications, updateOrderPayment, updateOrderStatus } from '@/lib/actions/admin/orders.actions';
import { ActionButton } from './ActionButton';
import { FormMessage } from './FormMessage';
import { inputClass, smallButtonClass } from './styles';

const FULFILLMENT_LABEL: Record<FulfillmentStatus, string> = {
  pending: 'Mark pending',
  confirmed: 'Confirm order',
  processing: 'Start processing',
  shipped: 'Mark shipped',
  delivered: 'Mark delivered',
  cancelled: 'Cancel order',
  returned: 'Mark returned',
};

const FULFILLMENT_CONFIRM: Partial<Record<FulfillmentStatus, string>> = {
  cancelled: 'Cancel this order? Stock will be restored and any coupon use refunded. This cannot be undone.',
  returned: 'Mark as returned? Stock will be restored. The coupon use stays spent. This cannot be undone.',
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: 'Mark unpaid',
  awaiting_verification: 'Awaiting verification',
  verified: 'Mark payment received',
  failed: 'Reject payment',
  refund_pending: 'Start refund',
  refunded: 'Mark refunded',
};

const PAYMENT_CONFIRM: Partial<Record<PaymentStatus, string>> = {
  failed: 'Reject this payment? If the order is still pending/confirmed it will be cancelled and stock restored.',
  verified: 'Confirm you have received this payment in full?',
};

export function OrderActions({
  orderId,
  fulfillmentNext,
  paymentNext,
}: {
  orderId: string;
  fulfillmentNext: FulfillmentStatus[];
  paymentNext: PaymentStatus[];
}) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteMessage, setNoteMessage] = useState<{ error?: string; success?: string } | null>(null);

  async function submitNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNoteBusy(true);
    setNoteMessage(null);
    const result = await addOrderNote({ orderId, note });
    setNoteBusy(false);
    if (!result.success) {
      setNoteMessage({ error: result.errorMessage });
      return;
    }
    setNote('');
    setNoteMessage({ success: 'Note added.' });
    router.refresh();
  }

  const positive = fulfillmentNext.filter((s) => s !== 'cancelled' && s !== 'returned');
  const negative = fulfillmentNext.filter((s) => s === 'cancelled' || s === 'returned');

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest2 text-ink-400">Fulfillment</p>
        {fulfillmentNext.length === 0 ? (
          <p className="text-sm text-ink-600">This order is closed — no further fulfillment changes.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {positive.map((s) => (
              <ActionButton key={s} action={updateOrderStatus.bind(null, orderId, s)} variant="primary">
                {FULFILLMENT_LABEL[s]}
              </ActionButton>
            ))}
            {negative.map((s) => (
              <ActionButton key={s} action={updateOrderStatus.bind(null, orderId, s)} variant="danger" confirm={FULFILLMENT_CONFIRM[s]}>
                {FULFILLMENT_LABEL[s]}
              </ActionButton>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest2 text-ink-400">Payment</p>
        {paymentNext.length === 0 ? (
          <p className="text-sm text-ink-600">No payment changes available in this state.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {paymentNext.map((s) => (
              <ActionButton
                key={s}
                action={updateOrderPayment.bind(null, orderId, s)}
                variant={s === 'failed' ? 'danger' : s === 'verified' ? 'primary' : 'default'}
                confirm={PAYMENT_CONFIRM[s]}
              >
                {PAYMENT_LABEL[s]}
              </ActionButton>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest2 text-ink-400">Notifications</p>
        <ActionButton
          action={resendOrderNotifications.bind(null, orderId)}
          successMessage={(data) => {
            const d = data as { sent: number; failed: number } | undefined;
            return d ? `Done — ${d.sent} sent, ${d.failed} failed. Unconfigured channels stay pending.` : 'Done.';
          }}
        >
          Resend order alert
        </ActionButton>
      </div>

      <form onSubmit={submitNote} className="flex flex-col gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-widest2 text-ink-400" htmlFor="staff-note">
          Internal note
        </label>
        <textarea id="staff-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} className={`${inputClass} resize-y`} placeholder="Only visible to staff — e.g. called customer, confirmed size." />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={noteBusy || !note.trim()} className={smallButtonClass}>
            {noteBusy ? 'Saving…' : 'Add note'}
          </button>
          <FormMessage error={noteMessage?.error} success={noteMessage?.success} />
        </div>
      </form>
    </div>
  );
}
