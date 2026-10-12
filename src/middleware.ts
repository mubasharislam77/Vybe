import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/auth.config';

const ADMIN_PUBLIC_PATHS = new Set(['/admin/login']);
const ACCOUNT_PUBLIC_PATHS = new Set(['/account/login', '/account/register']);

/**
 * Edge-safe, JWT-only gate (no DB access) as defense in depth alongside the
 * server-side `requireStaffPage` / `requireCustomerPage` checks that every
 * protected page and server action also performs directly.
 *
 * Built from `auth.config` (no Credentials providers) rather than `@/auth`:
 * the latter imports bcrypt and the MongoDB driver, which the Edge runtime
 * can't load — importing it here 500s every matched route.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith('/admin') && !ADMIN_PUBLIC_PATHS.has(pathname)) {
    if (role !== 'admin' && role !== 'staff') {
      const login = new URL('/admin/login', req.url);
      login.searchParams.set('next', pathname + search);
      return NextResponse.redirect(login);
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
