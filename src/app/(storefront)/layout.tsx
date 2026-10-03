import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';

/**
 * Shared chrome for every customer-facing page (shop, cart, checkout,
 * account, etc. — anything in this route group). Deliberately a route
 * group rather than the root layout: /admin will need entirely different
 * chrome (a sidebar, not this navbar/footer) and must not inherit this.
 */
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
