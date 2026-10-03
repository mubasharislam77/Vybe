import Link from 'next/link';
import type { CategoryNavNode } from '@/lib/services/catalog.service';
import type { StoreSettings } from '@/types/domain';

export default function Footer({
  categories,
  settings,
}: {
  categories: CategoryNavNode[];
  settings: StoreSettings;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink px-4 py-16 text-ivory sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-display text-2xl tracking-tight">VYBE</p>
            <p className="mt-3 max-w-[22ch] text-sm text-ivory/60">
              Pakistani streetwear for the expressive and unapologetic.
            </p>
          </div>

          <FooterCol
            title="Shop"
            links={[
              { label: 'Shop All', href: '/shop' },
              ...categories.map((c) => ({ label: c.name, href: `/category/${c.slug}` })),
              { label: 'Sale', href: '/sale' },
            ]}
          />

          <FooterCol
            title="Help"
            links={[
              { label: 'Size Guide', href: '/size-guide' },
              { label: 'Shipping', href: '/shipping' },
              { label: 'Returns & Exchanges', href: '/returns' },
              { label: 'Track Order', href: '/track-order' },
              { label: 'Contact', href: '/contact' },
            ]}
          />

          <FooterCol
            title="Brand"
            links={[
              { label: 'About', href: '/about' },
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
            ]}
          />
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-ivory/15 pt-8 text-xs text-ivory/50 sm:flex-row sm:items-center">
          <p>
            © {year} VybeTheBrand. All rights reserved.
          </p>
          <div className="flex gap-5">
            {settings.socialLinks.map((s) => (
              <a key={s.platform} href={s.url} target="_blank" rel="noreferrer" className="capitalize hover:text-ivory">
                {s.platform}
              </a>
            ))}
            {settings.whatsappSupportNumberE164 && (
              <a
                href={`https://wa.me/${settings.whatsappSupportNumberE164.replace('+', '')}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-ivory"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="mb-4 font-display text-xs uppercase tracking-widest2 text-lime">{title}</p>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-ivory/70 transition-colors hover:text-ivory">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
