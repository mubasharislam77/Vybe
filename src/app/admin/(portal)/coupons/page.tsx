import type { Metadata } from 'next';
import { requireStaffPage } from '@/lib/auth/session';
import { listCouponsForAdmin } from '@/lib/repositories/coupons.repo';
import { deleteCoupon, setCouponActive } from '@/lib/actions/admin/coupons.actions';
import { formatPKR } from '@/lib/utils/money';
import { formatDate, toDateTimeLocalValue } from '@/lib/utils/dates';
import { PageHeader } from '@/components/admin/PageHeader';
import { Panel } from '@/components/admin/Panel';
import { Disclosure } from '@/components/admin/Disclosure';
import { ActionButton } from '@/components/admin/ActionButton';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { CouponForm } from '@/components/admin/forms/CouponForm';
import { EmptyState } from '@/components/admin/EmptyState';
import { tableClass, tdClass, thClass } from '@/components/admin/styles';

export const metadata: Metadata = { title: 'Coupons' };

function couponState(c: { active: boolean; startsAt?: Date; expiresAt?: Date; usageLimit?: number; usageCount: number }): string {
  const now = new Date();
  if (!c.active) return 'inactive';
  if (c.startsAt && c.startsAt > now) return 'scheduled';
  if (c.expiresAt && c.expiresAt < now) return 'expired';
  if (c.usageLimit && c.usageCount >= c.usageLimit) return 'exhausted';
  return 'active';
}

export default async function AdminCouponsPage() {
  const user = await requireStaffPage();
  const coupons = await listCouponsForAdmin();

  return (
    <>
      <PageHeader title="Coupons" description="Discount codes customers enter at checkout. Usage limits are enforced atomically during the order transaction." />
      <div className="flex flex-col gap-6">
        <Panel title="Create coupon">
          <CouponForm couponId={null} />
        </Panel>
        <Panel title="All coupons" className="overflow-hidden">
          {coupons.length === 0 ? (
            <EmptyState title="No coupons yet" />
          ) : (
            <div className="relative -m-5 overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>Code</th>
                    <th className={thClass}>Discount</th>
                    <th className={thClass}>Rules</th>
                    <th className={thClass}>Usage</th>
                    <th className={thClass}>State</th>
                    <th className={thClass}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => {
                    const id = c._id.toString();
                    const state = couponState(c);
                    return (
                      <tr key={id} className="align-top hover:bg-ivory/60">
                        <td className={`${tdClass} font-mono text-xs font-semibold`}>{c.code}</td>
                        <td className={tdClass}>{c.type === 'percent' ? `${c.value}% off` : `${formatPKR(c.value)} off`}</td>
                        <td className={`${tdClass} text-xs text-ink-600`}>
                          {c.minSpendMinor ? <span className="block">Min spend {formatPKR(c.minSpendMinor)}</span> : null}
                          {c.startsAt ? <span className="block">From {formatDate(c.startsAt)}</span> : null}
                          {c.expiresAt ? <span className="block">Until {formatDate(c.expiresAt)}</span> : null}
                          {!c.minSpendMinor && !c.startsAt && !c.expiresAt && '—'}
                        </td>
                        <td className={tdClass}>
                          {c.usageCount}
                          {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                        </td>
                        <td className={tdClass}>
                          <StatusBadge status={state === 'active' ? 'active' : state === 'inactive' ? 'inactive' : 'pending'} label={state} />
                        </td>
                        <td className={tdClass}>
                          <div className="flex flex-wrap justify-end gap-1">
                            <ActionButton action={setCouponActive.bind(null, id, !c.active)} className="min-h-[32px] px-2 text-[11px]">
                              {c.active ? 'Deactivate' : 'Activate'}
                            </ActionButton>
                            {user.role === 'admin' && (
                              <ActionButton action={deleteCoupon.bind(null, id)} variant="danger" confirm={`Delete coupon ${c.code}?`} className="min-h-[32px] px-2 text-[11px]">
                                Delete
                              </ActionButton>
                            )}
                          </div>
                          <Disclosure label="Edit" className="mt-2 text-right">
                            <div className="border border-ink/10 bg-ivory p-4 text-left">
                              <CouponForm
                                couponId={id}
                                initial={{
                                  code: c.code,
                                  type: c.type,
                                  value: c.value,
                                  minSpendMinor: c.minSpendMinor,
                                  usageLimit: c.usageLimit,
                                  perCustomerLimit: c.perCustomerLimit,
                                  startsAt: toDateTimeLocalValue(c.startsAt),
                                  expiresAt: toDateTimeLocalValue(c.expiresAt),
                                  active: c.active,
                                }}
                              />
                            </div>
                          </Disclosure>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
