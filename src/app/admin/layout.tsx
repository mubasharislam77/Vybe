import type { Metadata } from 'next';

/**
 * Applies to /admin/login and the signed-in portal alike: never indexed,
 * never cached. The sidebar chrome lives one level down in (portal)/layout
 * so the login page stays bare.
 */
export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s — Vybe Admin' },
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
