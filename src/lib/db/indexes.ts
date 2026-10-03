import type { Db } from 'mongodb';

/**
 * All index definitions live here so `scripts/create-indexes.ts` (run once,
 * out of band — never on a request path) and documentation stay in sync with
 * what the repositories actually query.
 *
 * Multikey note: MongoDB refuses a compound index across two *different*
 * array fields ("parallel arrays"). `categoryIds`, `collectionIds`, `tags`
 * and `variants` are all arrays on `products`, so each compound index below
 * uses at most one of them. Sub-fields of the SAME array (e.g.
 * `variants.size` + `variants.colorName`) are fine together.
 */
export async function createAllIndexes(db: Db) {
  const products = db.collection('products');
  await products.createIndex({ slug: 1 }, { unique: true, name: 'uniq_slug' });
  await products.createIndex({ 'variants.sku': 1 }, { unique: true, sparse: true, name: 'uniq_variant_sku' });
  await products.createIndex({ status: 1, featured: 1, createdAt: -1 }, { name: 'featured_newest' });
  await products.createIndex({ status: 1, categoryIds: 1, createdAt: -1 }, { name: 'category_newest' });
  await products.createIndex({ status: 1, collectionIds: 1, createdAt: -1 }, { name: 'collection_newest' });
  await products.createIndex({ status: 1, audience: 1, createdAt: -1 }, { name: 'audience_newest' });
  await products.createIndex({ status: 1, tags: 1, createdAt: -1 }, { name: 'tags_newest' });
  await products.createIndex({ status: 1, salesCount: -1 }, { name: 'bestsellers' });
  await products.createIndex({ status: 1, 'variants.priceMinor': 1 }, { name: 'price_sort' });
  // Baseline search index — works on Atlas and self-hosted mongod alike.
  // See README "Search setup" for the optional Atlas Search upgrade ($search).
  await products.createIndex(
    { title: 'text', description: 'text', tags: 'text' },
    { name: 'text_search', weights: { title: 10, tags: 5, description: 1 } },
  );

  const categories = db.collection('categories');
  await categories.createIndex({ slug: 1 }, { unique: true, name: 'uniq_slug' });
  await categories.createIndex({ parentId: 1, order: 1 }, { name: 'tree_order' });

  const collections = db.collection('collections');
  await collections.createIndex({ slug: 1 }, { unique: true, name: 'uniq_slug' });
  await collections.createIndex({ isActive: 1, startsAt: -1 }, { name: 'active_recent' });

  const customers = db.collection('customers');
  await customers.createIndex({ email: 1 }, { unique: true, sparse: true, name: 'uniq_email' });
  await customers.createIndex({ phoneE164: 1 }, { unique: true, name: 'uniq_phone' });

  const staffUsers = db.collection('staff_users');
  await staffUsers.createIndex({ email: 1 }, { unique: true, name: 'uniq_email' });

  const orders = db.collection('orders');
  await orders.createIndex({ orderNumber: 1 }, { unique: true, name: 'uniq_order_number' });
  await orders.createIndex({ trackingToken: 1 }, { unique: true, name: 'uniq_tracking_token' });
  await orders.createIndex({ idempotencyKey: 1 }, { unique: true, name: 'uniq_idempotency_key' });
  await orders.createIndex({ customerId: 1, createdAt: -1 }, { name: 'customer_history' });
  await orders.createIndex({ fulfillmentStatus: 1, createdAt: -1 }, { name: 'admin_fulfillment_filter' });
  await orders.createIndex({ paymentStatus: 1, createdAt: -1 }, { name: 'admin_payment_filter' });
  await orders.createIndex({ placedAt: -1 }, { name: 'admin_listing_default' });

  const coupons = db.collection('coupons');
  await coupons.createIndex({ code: 1 }, { unique: true, name: 'uniq_code' });

  const reviews = db.collection('reviews');
  await reviews.createIndex({ productId: 1, status: 1, createdAt: -1 }, { name: 'product_approved_recent' });

  const outbox = db.collection('notification_outbox');
  await outbox.createIndex({ orderId: 1, channel: 1 }, { unique: true, name: 'uniq_order_channel' });
  await outbox.createIndex({ status: 1, nextAttemptAt: 1 }, { name: 'worker_claim' });

  const auditLogs = db.collection('audit_logs');
  await auditLogs.createIndex({ targetType: 1, targetId: 1, at: -1 }, { name: 'by_target' });
  await auditLogs.createIndex({ actorId: 1, at: -1 }, { name: 'by_actor' });

  const rateLimit = db.collection('rate_limit_buckets');
  await rateLimit.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'ttl_expiry' });

  const carts = db.collection('carts');
  await carts.createIndex({ customerId: 1 }, { unique: true, name: 'uniq_customer' });
}
