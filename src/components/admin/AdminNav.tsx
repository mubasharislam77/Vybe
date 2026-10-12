'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SessionRole } from '@/auth.config';
import type { NavGroup } from './nav-groups';

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(href + '/');
}

export function AdminNav({
  role,
  groups,
  userName,
}: {
  role: SessionRole;
  groups: NavGroup[];
  userName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav aria-label="Admin navigation" className="flex flex-col gap-6">
      {groups.map((group) => {
        const items = group.items.filter((item) => !item.adminOnly || role === 'admin');
        if (items.length === 0) return null;
        return (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest2 text-ivory/40">{group.title}</p>
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-[40px] items-center justify-between gap-2 px-3 text-sm transition-colors ${
                        active ? 'bg-lime text-ink' : 'text-ivory/80 hover:bg-ivory/10 hover:text-ivory'
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.badge ? (
                        <span
                          className={`min-w-[1.5rem] px-1.5 py-0.5 text-center text-[10px] font-bold ${
                            active ? 'bg-ink text-lime' : 'bg-burgundy text-ivory'
                          }`}
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-ink/10 bg-ink px-4 py-3 text-ivory lg:hidden">
        <Link href="/admin" className="font-display text-lg uppercase tracking-widest2">
          Vybe <span className="text-lime">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          className="min-h-[40px] border border-ivory/30 px-3 text-xs font-semibold uppercase tracking-widest2"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
      {open && (
        <div id="admin-mobile-nav" className="border-b border-ink/10 bg-ink p-4 text-ivory lg:hidden">
          {nav}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-ink text-ivory lg:flex">
        <div className="sticky top-0 flex h-screen flex-col overflow-y-auto">
          <Link href="/admin" className="block border-b border-ivory/10 px-6 py-5 font-display text-xl uppercase tracking-widest2">
            Vybe <span className="text-lime">Admin</span>
          </Link>
          <div className="flex-1 p-3">{nav}</div>
          <div className="border-t border-ivory/10 px-6 py-4 text-xs text-ivory/60">
            <p className="truncate font-medium text-ivory">{userName}</p>
            <p className="uppercase tracking-widest2">{role}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
