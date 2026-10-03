import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const ADMIN_PUBLIC_PATHS = new Set(['/admin/login']);
const ACCOUNT_PUBLIC_PATHS = new Set(['/account/login', '/account/register']);

/**
 * Edge-safe, JWT-only gate (no DB access) as defense in depth alongside the
 * server-side `requireStaffPage` / `requireCustomerPage` checks that every
 * protected page and server action also performs directly.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith('/admin') && !ADMIN_PUBLIC_PATHS.has(pathname)) {
    if (role !== 'admin' && role !== 'staff') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  if (pathname.startsWith('/account') && !ACCOUNT_PUBLIC_PATHS.has(pathname)) {
    if (role !== 'customer') {
      return NextResponse.redirect(new URL('/account/login', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
};
