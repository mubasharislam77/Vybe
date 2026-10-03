import type { ObjectId } from 'mongodb';

/** Integer minor currency unit (1 PKR = 100 paisa). All money is stored/computed in this unit. */
export type MinorUnits = number;

export type Audience = 'men' | 'women' | 'unisex';
export type FulfillmentType = 'ready_stock' | 'made_to_order';
export type ProductStatus = 'draft' | 'published';

export interface ProductImage {
  url: string;
  publicId: string;
  alt: string;
  order: number;
}

export interface Variant {
  sku: string;
  size: string;
  colorName: string;
  colorSwatchHex: string;
  priceMinor: MinorUnits;
  compareAtPriceMinor?: MinorUnits;
  stock: number;
  images: ProductImage[];
}

export interface Product {
  _id: ObjectId;
  slug: string;
  title: string;
  description: string;
  status: ProductStatus;
  categoryIds: ObjectId[];
  collectionIds: ObjectId[];
  tags: string[];
  audience: Audience;
  images: ProductImage[];
  videoUrl?: string;
  fabric?: string;
  fit?: string;
  careInstructions?: string;
  sizeGuideId?: ObjectId;
  seoTitle?: string;
  seoDescription?: string;
  featured: boolean;
  fulfillment: FulfillmentType;
  productionLeadTimeDays?: number;
  variants: Variant[];
  /** Denormalized counter, incremented when an order is durably placed. Drives "best sellers" sort. */
  salesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  _id: ObjectId;
  slug: string;
  name: string;
  parentId: ObjectId | null;
  order: number;
  description?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Marketing/lookbook collection (e.g. a seasonal drop) — distinct from garment categories. */
export interface ProductCollection {
  _id: ObjectId;
  slug: string;
  name: string;
  description?: string;
  bannerImageUrl?: string;
  isActive: boolean;
  startsAt?: Date;
  endsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CustomerRole = 'customer';
export type StaffRole = 'admin' | 'staff';

export interface Address {
  fullName: string;
  phoneE164: string;
  alternatePhoneE164?: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode?: string;
  landmark?: string;
}

export interface Customer {
  _id: ObjectId;
  email?: string;
  phoneE164: string;
  passwordHash: string;
  fullName: string;
  role: CustomerRole;
  addresses: Address[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffUser {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  fullName: string;
  role: StaffRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMethod = 'cod' | 'bank_transfer';
export type PaymentStatus =
  | 'pending'
  | 'awaiting_verification'
  | 'verified'
  | 'failed'
  | 'refund_pending'
  | 'refunded';
export type FulfillmentStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface OrderLineItem {
  productId: ObjectId;
  productSlug: string;
  title: string;
  sku: string;
  size: string;
  colorName: string;
  imageUrl?: string;
  unitPriceMinor: MinorUnits;
  quantity: number;
  lineTotalMinor: MinorUnits;
  fulfillment: FulfillmentType;
  productionLeadTimeDays?: number;
}

export interface AppliedCoupon {
  code: string;
  discountMinor: MinorUnits;
}

export interface Order {
  _id: ObjectId;
  orderNumber: string;
  trackingToken: string;
  customerId: ObjectId | null;
  idempotencyKey: string;
  items: OrderLineItem[];
  subtotalMinor: MinorUnits;
  discountMinor: MinorUnits;
  shippingMinor: MinorUnits;
  totalMinor: MinorUnits;
  coupon?: AppliedCoupon;
  shipping: Address;
  notes?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  bankTransferProof?: { url: string; publicId: string; submittedAt: Date };
  fulfillmentStatus: FulfillmentStatus;
  statusHistory: { status: FulfillmentStatus; at: Date; by: string }[];
  placedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  _id: ObjectId;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minSpendMinor?: MinorUnits;
  usageLimit?: number;
  usageCount: number;
  perCustomerLimit?: number;
  startsAt?: Date;
  expiresAt?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  _id: ObjectId;
  productId: ObjectId;
  customerId: ObjectId | null;
  customerName: string;
  rating: number;
  title?: string;
  body: string;
  verifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export type NotificationChannel = 'whatsapp';
export type NotificationStatus = 'pending' | 'provider_accepted' | 'delivered' | 'failed';

export interface NotificationOutboxEntry {
  _id: ObjectId;
  channel: NotificationChannel;
  orderId: ObjectId;
  orderNumber: string;
  status: NotificationStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  lockedAt?: Date;
  lockedBy?: string;
  providerMessageId?: string;
  lastError?: string;
  payloadSummary: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogEntry {
  _id: ObjectId;
  actorId: ObjectId;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  diff?: Record<string, unknown>;
  at: Date;
}

export interface ShippingZone {
  name: string;
  cities: string[];
  feeMinor: MinorUnits;
  codEligible: boolean;
}

export interface StoreSettings {
  _id: ObjectId;
  storeName: string;
  contactPhoneE164: string;
  contactEmail: string;
  whatsappSupportNumberE164: string;
  socialLinks: { platform: string; url: string }[];
  shippingZones: ShippingZone[];
  freeShippingThresholdMinor?: MinorUnits;
  defaultShippingFeeMinor: MinorUnits;
  bankTransferInstructions?: string;
  updatedAt: Date;
}

export interface RateLimitBucket {
  _id: string;
  count: number;
  windowStart: Date;
  expiresAt: Date;
}
