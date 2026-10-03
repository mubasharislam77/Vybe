import type { Collection } from 'mongodb';
import { getDb } from './client';
import type {
  Product,
  Category,
  ProductCollection,
  Customer,
  StaffUser,
  Order,
  Coupon,
  Review,
  NotificationOutboxEntry,
  AuditLogEntry,
  StoreSettings,
  RateLimitBucket,
  Cart,
} from '@/types/domain';

export async function products(): Promise<Collection<Product>> {
  return (await getDb()).collection<Product>('products');
}
export async function categories(): Promise<Collection<Category>> {
  return (await getDb()).collection<Category>('categories');
}
export async function productCollections(): Promise<Collection<ProductCollection>> {
  return (await getDb()).collection<ProductCollection>('collections');
}
export async function customers(): Promise<Collection<Customer>> {
  return (await getDb()).collection<Customer>('customers');
}
export async function staffUsers(): Promise<Collection<StaffUser>> {
  return (await getDb()).collection<StaffUser>('staff_users');
}
export async function orders(): Promise<Collection<Order>> {
  return (await getDb()).collection<Order>('orders');
}
export async function coupons(): Promise<Collection<Coupon>> {
  return (await getDb()).collection<Coupon>('coupons');
}
export async function reviews(): Promise<Collection<Review>> {
  return (await getDb()).collection<Review>('reviews');
}
export async function notificationOutbox(): Promise<Collection<NotificationOutboxEntry>> {
  return (await getDb()).collection<NotificationOutboxEntry>('notification_outbox');
}
export async function auditLogs(): Promise<Collection<AuditLogEntry>> {
  return (await getDb()).collection<AuditLogEntry>('audit_logs');
}
export async function storeSettings(): Promise<Collection<StoreSettings>> {
  return (await getDb()).collection<StoreSettings>('store_settings');
}
export async function rateLimitBuckets(): Promise<Collection<RateLimitBucket>> {
  return (await getDb()).collection<RateLimitBucket>('rate_limit_buckets');
}
export async function carts(): Promise<Collection<Cart>> {
  return (await getDb()).collection<Cart>('carts');
}
