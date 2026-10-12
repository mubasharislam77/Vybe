import Link from 'next/link';
import type { SessionRole } from '@/auth.config';
import { AdminNav } from './AdminNav';
import { buildNavGroups } from './nav-groups';
import { SignOutButton } from './SignOutButton';

export function AdminShell({
  user,
  badges,
  children,
}: {
  user: { name: string; role: SessionRole; email?: string | null };
  badges: { pendingOrders: number; pendingReviews: number; failedNotifications: number };
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-ivory lg:flex-row">
      <AdminNav role={user.role} groups={buildNavGroups(badges)} userName={user.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden items-center justify-between border-b border-ink/10 bg-white px-8 py-3 lg:flex">
          <Link href="/" target="_blank" rel="noreferrer" className="text-xs text-ink-400 underline-offset-4 hover:text-ink hover:underline">
            View storefront ↗
          </Link>
          <div className="flex items-center gap-4 text-xs text-ink-600">
            <span>
              Signed in as <strong className="text-ink">{user.email ?? user.name}</strong>
            </span>
            <SignOutButton />
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        <footer className="flex items-center justify-between px-4 py-3 text-[11px] text-ink-400 sm:px-6 lg:hidden">
          <span>{user.email ?? user.name}</span>
          <SignOutButton />
        </footer>
      </div>
    </div>
  );
}
