import type { Metadata } from 'next';
import { requireStaffPage } from '@/lib/auth/session';
import { listStaffUsers } from '@/lib/repositories/staff.repo';
import { formatDateTime } from '@/lib/utils/dates';
import { PageHeader } from '@/components/admin/PageHeader';
import { Panel } from '@/components/admin/Panel';
import { Disclosure } from '@/components/admin/Disclosure';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { CreateStaffForm, StaffRowEditor } from '@/components/admin/forms/StaffForms';

export const metadata: Metadata = { title: 'Staff accounts' };

export default async function AdminStaffPage() {
  const me = await requireStaffPage('admin');
  const staff = await listStaffUsers();

  return (
    <>
      <PageHeader
        title="Staff accounts"
        description="Admins can do everything here. Staff can manage orders, catalog content, reviews and notifications, but not settings, staff accounts, deletions, or the audit log."
      />
      <div className="flex flex-col gap-6">
        <Panel title="Invite a team member">
          <CreateStaffForm />
        </Panel>
        <Panel title={`Accounts (${staff.length})`}>
          <ul className="-mt-2 flex flex-col">
            {staff.map((s) => {
              const id = s._id.toString();
              const isSelf = id === me.id;
              return (
                <li key={id} className="border-b border-ink/5 py-4 last:border-b-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
                        {s.fullName}
                        {isSelf && <span className="text-xs font-normal text-ink-400">(you)</span>}
                        <StatusBadge status={s.role} />
                        <StatusBadge status={s.active ? 'active' : 'inactive'} />
                      </p>
                      <p className="text-xs text-ink-400">
                        {s.email} · added {formatDateTime(s.createdAt)}
                      </p>
                    </div>
                    <Disclosure label="Manage">
                      <div className="border border-ink/10 bg-ivory p-4">
                        <StaffRowEditor staff={{ id, fullName: s.fullName, email: s.email, role: s.role, active: s.active }} isSelf={isSelf} />
                      </div>
                    </Disclosure>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </>
  );
}
