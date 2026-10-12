/** Sidebar structure. Plain data (no 'use client') so the server shell can build it and hand it to the client nav. */
export interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
  badge?: number;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export function buildNavGroups(badges: { pendingOrders: number; pendingReviews: number; failedNotifications: number }): NavGroup[] {
  return [
    {
      title: 'Operations',
      items: [
        { href: '/admin', label: 'Dashboard' },
        { href: '/admin/orders', label: 'Orders', badge: badges.pendingOrders },
        { href: '/admin/customers', label: 'Customers' },
        { href: '/admin/reviews', label: 'Reviews', badge: badges.pendingReviews },
        { href: '/admin/notifications', label: 'Notifications', badge: badges.failedNotifications },
      ],
    },
    {
      title: 'Catalog',
      items: [
        { href: '/admin/products', label: 'Products' },
        { href: '/admin/categories', label: 'Categories' },
        { href: '/admin/collections', label: 'Collections' },
        { href: '/admin/coupons', label: 'Coupons' },
      ],
    },
    {
      title: 'Administration',
      items: [
        { href: '/admin/settings', label: 'Store settings', adminOnly: true },
        { href: '/admin/staff', label: 'Staff accounts', adminOnly: true },
        { href: '/admin/audit-log', label: 'Audit log', adminOnly: true },
        { href: '/admin/account', label: 'My account' },
      ],
    },
  ];
}
