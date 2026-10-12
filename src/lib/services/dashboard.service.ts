import { getOrderStats, listRecentOrders, type OrderStats } from '@/lib/repositories/orders.repo';
import { getCatalogStats, listLowStockVariants, countLowStockVariants, type LowStockVariant } from '@/lib/repositories/products.repo';
import { countReviewsByStatus } from '@/lib/repositories/reviews.repo';
import { countNotificationsByStatus } from '@/lib/repositories/notifications.repo';
import { countCustomers } from '@/lib/repositories/customers.repo';
import { getCloudinaryConfig, getEmailConfig, getWhatsAppConfig, getCronSecret } from '@/lib/env';
import type { Order } from '@/types/domain';

export interface IntegrationHealth {
  key: 'email' | 'whatsapp' | 'cloudinary' | 'cron';
  label: string;
  configured: boolean;
  detail: string;
}

export function getIntegrationHealth(): IntegrationHealth[] {
  const email = getEmailConfig();
  return [
    {
      key: 'email',
      label: 'Email (Resend)',
      configured: email !== null,
      detail: email ? `Order alerts go to ${email.ADMIN_NOTIFICATION_EMAIL}` : 'Set RESEND_API_KEY and ADMIN_NOTIFICATION_EMAIL',
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp Cloud API',
      configured: getWhatsAppConfig() !== null,
      detail: getWhatsAppConfig() ? 'Credentials present' : 'Optional — WhatsApp outbox entries stay pending until configured',
    },
    {
      key: 'cloudinary',
      label: 'Cloudinary (media)',
      configured: getCloudinaryConfig() !== null,
      detail: getCloudinaryConfig() ? 'Direct browser uploads enabled' : 'Product image upload disabled; paste image URLs instead',
    },
    {
      key: 'cron',
      label: 'Notification cron secret',
      configured: getCronSecret() !== null,
      detail: getCronSecret() ? 'Backstop worker can authenticate' : 'CRON_SECRET missing or under 16 chars — scheduled retries will be rejected',
    },
  ];
}

export interface DashboardData {
  orders: OrderStats;
  recentOrders: Order[];
  catalog: { total: number; published: number; draft: number };
  lowStock: LowStockVariant[];
  lowStockCount: number;
  reviews: { pending: number; approved: number; rejected: number };
  notifications: { pending: number; provider_accepted: number; delivered: number; failed: number };
  customers: number;
  integrations: IntegrationHealth[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const [orders, recentOrders, catalog, lowStock, lowStockCount, reviews, notifications, customers] = await Promise.all([
    getOrderStats(),
    listRecentOrders(8),
    getCatalogStats(),
    listLowStockVariants(8),
    countLowStockVariants(),
    countReviewsByStatus(),
    countNotificationsByStatus(),
    countCustomers(),
  ]);
  return { orders, recentOrders, catalog, lowStock, lowStockCount, reviews, notifications, customers, integrations: getIntegrationHealth() };
}

/** Lightweight counts for the sidebar badges — runs on every admin page, so keep it to three cheap counts. */
export async function getNavBadges(): Promise<{ pendingOrders: number; pendingReviews: number; failedNotifications: number }> {
  const { orders: ordersCol, reviews: reviewsCol, notificationOutbox } = await import('@/lib/db/collections');
  const [o, r, n] = await Promise.all([ordersCol(), reviewsCol(), notificationOutbox()]);
  const [pendingOrders, pendingReviews, failedNotifications] = await Promise.all([
    o.countDocuments({ fulfillmentStatus: 'pending' }),
    r.countDocuments({ status: 'pending' }),
    n.countDocuments({ status: 'failed' }),
  ]);
  return { pendingOrders, pendingReviews, failedNotifications };
}
