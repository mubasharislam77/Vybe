'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart/cart-context';
import type { CategoryNavNode } from '@/lib/services/catalog.service';

const STATIC_LINKS = [
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'Best Sellers', href: '/best-sellers' },
  { label: 'Sale', href: '/sale' },
];

export default function Navbar({ categories }: { categories: CategoryNavNode[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalQuantity, isLoaded } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? 'border-ink/10 bg-ivory/95 backdrop-blur-sm' : 'border-transparent bg-ivory'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="VybeTheBrand home">
          <Image src="/vybe-logo.png" alt="" width={32} height={32} priority className="h-8 w-8" />
          <span className="font-display text-lg tracking-tight text-ink">VYBE</span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          <Link href="/shop" className="text-sm text-ink transition-colors hover:text-burgundy">
            Shop All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="text-sm text-ink transition-colors hover:text-burgundy"
            >
              {cat.name}
            </Link>
          ))}
          {STATIC_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-ink transition-colors hover:text-burgundy">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/search"
            aria-label="Search"
            className="flex h-11 w-11 items-center justify-center text-ink hover:text-burgundy"
          >
            <SearchIcon />
          </Link>
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="hidden h-11 w-11 items-center justify-center text-ink hover:text-burgundy sm:flex"
          >
            <HeartIcon />
          </Link>
          <Link
            href="/account"
            aria-label="Account"
            className="hidden h-11 w-11 items-center justify-center text-ink hover:text-burgundy sm:flex"
          >
            <UserIcon />
          </Link>
          <Link
            href="/cart"
            aria-label={`Cart, ${totalQuantity} item${totalQuantity === 1 ? '' : 's'}`}
            className="relative flex h-11 w-11 items-center justify-center text-ink hover:text-burgundy"
          >
            <BagIcon />
            {isLoaded && totalQuantity > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-burgundy text-[10px] font-semibold text-ivory">
                {totalQuantity > 9 ? '9+' : totalQuantity}
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-11 w-11 items-center justify-center text-ink lg:hidden"
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-ink/10 bg-ivory px-4 py-4 lg:hidden">
          <ul className="flex flex-col divide-y divide-ink/10">
            <li>
              <Link href="/shop" onClick={() => setMobileOpen(false)} className="block min-h-[44px] py-3 text-sm">
                Shop All
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/category/${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="block min-h-[44px] py-3 text-sm"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
            {STATIC_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setMobileOpen(false)} className="block min-h-[44px] py-3 text-sm">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/account" onClick={() => setMobileOpen(false)} className="block min-h-[44px] py-3 text-sm">
                Account
              </Link>
            </li>
            <li>
              <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="block min-h-[44px] py-3 text-sm">
                Wishlist
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z" strokeLinejoin="round" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" strokeLinecap="round" />
    </svg>
  );
}
function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M6 8h12l1 13H5L6 8Z" strokeLinejoin="round" />
      <path d="M9 8a3 3 0 0 1 6 0" strokeLinecap="round" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}
