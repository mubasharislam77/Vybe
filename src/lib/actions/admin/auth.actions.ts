'use server';

import { headers } from 'next/headers';
import { AuthError } from 'next-auth';
import { signIn, signOut } from '@/auth';
import { staffLoginSchema } from '@/lib/validation/auth';
import { changeOwnPasswordSchema } from '@/lib/validation/admin';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/rate-limit/limiter';
import { changeOwnPassword } from '@/lib/services/staff.service';
import { runAdminAction, audit, fail, ok, firstIssue, type AdminActionResult } from './_shared';

export interface StaffLoginState {
  errorMessage?: string;
}

/**
 * Server-side credential sign-in (rather than `signIn` from next-auth/react)
 * so the attempt can be rate-limited per IP before it ever reaches bcrypt,
 * and so the form works without client JS. On success Auth.js throws a
 * redirect to `redirectTo`, which must propagate — only AuthError is caught.
 */
export async function staffLogin(_prev: StaffLoginState, formData: FormData): Promise<StaffLoginState> {
  const headerList = await headers();
  const ip = clientIpFromHeaders(headerList);
  const { allowed } = await checkRateLimit(`staff-login:${ip}`, 10, 10 * 60_000);
  if (!allowed) {
    return { errorMessage: 'Too many sign-in attempts. Please wait 10 minutes and try again.' };
  }

  const parsed = staffLoginSchema.safeParse({
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    password: String(formData.get('password') ?? ''),
  });
  if (!parsed.success) return { errorMessage: 'Enter your email and password.' };

  const rawNext = String(formData.get('next') ?? '');
  const redirectTo = rawNext.startsWith('/admin') && !rawNext.startsWith('//') ? rawNext : '/admin';

  try {
    await signIn('staff', { email: parsed.data.email, password: parsed.data.password, redirectTo });
  } catch (err) {
    if (err instanceof AuthError) {
      return { errorMessage: 'Invalid email or password.' };
    }
    throw err;
  }
  return {};
}

export async function staffSignOut(): Promise<void> {
  await signOut({ redirectTo: '/admin/login' });
}

export async function changeMyPassword(rawInput: unknown): Promise<AdminActionResult> {
  return runAdminAction('staff', async (actor) => {
    const parsed = changeOwnPasswordSchema.safeParse(rawInput);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    await changeOwnPassword(actor.id, parsed.data.currentPassword, parsed.data.newPassword);
    await audit(actor, 'staff.password_changed', 'staff', actor.id);
    return ok();
  });
}
