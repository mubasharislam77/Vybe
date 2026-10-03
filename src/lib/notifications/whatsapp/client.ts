import { createHmac, timingSafeEqual } from 'node:crypto';
import { getWhatsAppConfig } from '@/lib/env';
import type { TemplatePlan } from './templates';

const GRAPH_API_VERSION = 'v21.0';

export class WhatsAppNotConfiguredError extends Error {
  constructor() {
    super('WhatsApp Cloud API credentials are not configured');
  }
}

export class WhatsAppSendError extends Error {
  constructor(message: string, public responseBody?: unknown) {
    super(message);
  }
}

interface SendResult {
  providerMessageId: string;
}

/**
 * Sends one of the two approved order-notification templates via Meta's
 * WhatsApp Cloud API. Business-initiated messages (which this always is —
 * the admin hasn't necessarily messaged us in the last 24h) MUST use a
 * pre-approved template; free-form text is rejected by the API outside an
 * open customer-service window. See README "WhatsApp setup" for the exact
 * template definitions to submit for approval in Meta Business Manager.
 */
export async function sendOrderTemplate(plan: TemplatePlan, documentUrl?: string): Promise<SendResult> {
  const config = getWhatsAppConfig();
  if (!config) throw new WhatsAppNotConfiguredError();

  const components: Record<string, unknown>[] = [];
  if (plan.templateName === 'vybe_new_order_document') {
    if (!documentUrl) throw new WhatsAppSendError('Document URL required for document template');
    components.push({
      type: 'header',
      parameters: [{ type: 'document', document: { link: documentUrl, filename: plan.documentFilename } }],
    });
  }
  components.push({
    type: 'body',
    parameters: plan.bodyParams.map((text) => ({ type: 'text', text })),
  });

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.WHATSAPP_CLOUD_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: config.WHATSAPP_ADMIN_NOTIFICATION_NUMBER.replace(/^\+/, ''),
        type: 'template',
        template: {
          name: plan.templateName,
          language: { code: 'en' },
          components,
        },
      }),
    },
  );

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (body as { error?: { message?: string } } | null)?.error?.message ?? `HTTP ${res.status}`;
    throw new WhatsAppSendError(message, body);
  }

  const providerMessageId = body?.messages?.[0]?.id;
  if (!providerMessageId) {
    throw new WhatsAppSendError('Cloud API accepted the request but returned no message id', body);
  }
  return { providerMessageId };
}

/** Verifies Meta's X-Hub-Signature-256 header on incoming delivery-status webhooks. */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const config = getWhatsAppConfig();
  if (!config || !signatureHeader) return false;
  const expected = 'sha256=' + createHmac('sha256', config.WHATSAPP_APP_SECRET).update(rawBody).digest('hex');
  if (expected.length !== signatureHeader.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}
