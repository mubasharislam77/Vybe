import { Injectable, Logger } from '@nestjs/common';

type Subscriber = { email: string; subscribedAt: string };

/**
 * In-memory subscriber store. For production, persist to a DB and/or forward to
 * an email provider (Mailchimp, Resend, Brevo). The controller contract stays the same.
 */
@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);
  private readonly subscribers = new Map<string, Subscriber>();

  subscribe(email: string): { ok: boolean; message: string; alreadySubscribed: boolean } {
    const key = email.toLowerCase().trim();
    if (this.subscribers.has(key)) {
      return {
        ok: true,
        alreadySubscribed: true,
        message: 'You’re already on the list — vibe secured.',
      };
    }
    this.subscribers.set(key, { email: key, subscribedAt: new Date().toISOString() });
    this.logger.log(`New subscriber: ${key} (total ${this.subscribers.size})`);
    return {
      ok: true,
      alreadySubscribed: false,
      message: 'You’re on the list. Drop 01 access incoming.',
    };
  }

  count(): number {
    return this.subscribers.size;
  }
}
