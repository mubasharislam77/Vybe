import type { Metadata } from 'next';
import { requireStaffPage } from '@/lib/auth/session';
import { findStaffById } from '@/lib/repositories/staff.repo';
import { formatDateTime } from '@/lib/utils/dates';
import { PageHeader } from '@/components/admin/PageHeader';
import { Panel } from '@/components/admin/Panel';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ChangePasswordForm } from '@/components/admin/forms/ChangePasswordForm';

export const metadata: Metadata = { title: 'My account' };

export default async function AdminAccountPage() {
  const user = await requireStaffPage();
  const me = await findStaffById(user.id);

  return (
    <>
      <PageHeader title="My account" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Profile">
          <dl className="flex flex-col gap-3 text-sm">
            <div>
              <dt className="text-xs text-ink-400">Name</dt>
              <dd className="font-medium">{me?.fullName ?? user.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-400">Email</dt>
              <dd>{me?.email ?? user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-400">Role</dt>
              <dd>
                <StatusBadge status={user.role} />
              </dd>
            </div>
            {me && (
              <div>
                <dt className="text-xs text-ink-400">Account created</dt>
                <dd>{formatDateTime(me.createdAt)}</dd>
              </div>
            )}
          </dl>
          <p className="mt-4 text-xs text-ink-400">Name and role changes are made by an admin under Staff accounts.</p>
        </Panel>
        <Panel title="Change password">
          <ChangePasswordForm />
        </Panel>
      </div>
    </>
  );
}
