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
 * Sends from the store's own verified domain (vybethebrand.store — DKIM/
 * SPF verified in Resend as of Oct 2026). Before domain verification,
 * Resend's free tier only allowed sending FROM their shared
 * `onboarding@resend.dev` address TO the Resend account's own email —
 * that restriction is now lifted, so this can send to any recipient.
 */
export async function sendOrderEmail(email: OrderEmail): Promise<{ id: string }> {
  const config = getEmailConfig();
  if (!config) throw new EmailNotConfiguredError();

  const resend = new Resend(config.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: 'VybeTheBrand Orders <orders@vybethebrand.store>',
    to: config.ADMIN_NOTIFICATION_EMAIL,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  if (error) throw new EmailSendError(error.message);
  if (!data?.id) throw new EmailSendError('Resend accepted the request but returned no message id');
  return { id: data.id };
}
