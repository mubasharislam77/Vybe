'use server';

import { headers } from 'next/headers';
import { customerRegisterSchema } from '@/lib/validation/auth';
import { hashPassword } from '@/lib/auth/password';
import { createCustomer, findCustomerByIdentifier } from '@/lib/repositories/customers.repo';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/rate-limit/limiter';

export interface RegisterActionResult {
  success: boolean;
  errorMessage?: string;
}

export async function registerCustomer(rawInput: unknown): Promise<RegisterActionResult> {
  const headerList = await headers();
  const ip = clientIpFromHeaders(headerList);
  const { allowed } = await checkRateLimit(`register:${ip}`, 10, 60_000);
  if (!allowed) {
    return { success: false, errorMessage: 'Too many attempts — please wait a moment and try again.' };
  }

  const parsed = customerRegisterSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, errorMessage: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  }

  const existing = await findCustomerByIdentifier(parsed.data.phoneE164);
  if (existing) {
    return { success: false, errorMessage: 'An account with this phone number already exists.' };
  }
  if (parsed.data.email) {
    const existingByEmail = await findCustomerByIdentifier(parsed.data.email);
    if (existingByEmail) {
      return { success: false, errorMessage: 'An account with this email already exists.' };
    }
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await createCustomer({
    fullName: parsed.data.fullName,
    phoneE164: parsed.data.phoneE164,
    email: parsed.data.email,
    passwordHash,
  });

  return { success: true };
}
