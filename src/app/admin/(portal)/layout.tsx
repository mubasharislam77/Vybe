import { requireStaffPage } from '@/lib/auth/session';
import { getNavBadges } from '@/lib/services/dashboard.service';
import { AdminShell } from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

export default async function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaffPage();
  const badges = await getNavBadges();
  return (
    <AdminShell user={{ name: user.name, role: user.role, email: user.email }} badges={badges}>
      {children}
    </AdminShell>
  );
}
