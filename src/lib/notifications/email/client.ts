import { Resend } from 'resend';
import { getEmailConfig } from '@/lib/env';
import type { OrderEmail } from './templates';

export class EmailNotConfiguredError extends Error {
  constructor() {
    super('Email notification credentials are not configured');
  }
}

export class EmailSendError extends Error {}

/**
 * Resend's free tier (no card, no domain verification required) only
 * allows sending FROM their shared `onboarding@resend.dev` address TO the
 * email address that owns the Resend account. That's fine here — the
 * recipient is always the store's own admin inbox. Verifying your own
 * domain later (still free) lifts that restriction and lets you use a
 * branded From address, but isn't required for this to work.
 */
export async function sendOrderEmail(email: OrderEmail): Promise<{ id: string }> {
  const config = getEmailConfig();
  if (!config) throw new EmailNotConfiguredError();

  const resend = new Resend(config.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: 'VybeTheBrand Orders <onboarding@resend.dev>',
    to: config.ADMIN_NOTIFICATION_EMAIL,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  if (error) throw new EmailSendError(error.message);
  if (!data?.id) throw new EmailSendError('Resend accepted the request but returned no message id');
  return { id: data.id };
}
