import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
  }
}

/** For server actions / route handlers, where a redirect isn't appropriate — throw instead. */
export async function requireCustomerSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'customer') {
    throw new UnauthorizedError('Customer session required');
  }
  return session.user;
}

export async function requireStaffSession(minRole: 'staff' | 'admin' = 'staff') {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== 'admin' && role !== 'staff')) {
    throw new UnauthorizedError('Staff session required');
  }
  if (minRole === 'admin' && role !== 'admin') {
    throw new UnauthorizedError('Admin session required');
  }
  return session.user;
}

/** For Server Components, where redirecting to login is the right UX. */
export async function requireCustomerPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'customer') {
    redirect('/account/login');
  }
  return session.user;
}

export async function requireStaffPage(minRole: 'staff' | 'admin' = 'staff') {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== 'admin' && role !== 'staff')) {
    redirect('/admin/login');
  }
  if (minRole === 'admin' && role !== 'admin') {
    redirect('/admin');
  }
  return session.user;
}
