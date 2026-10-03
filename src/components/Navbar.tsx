'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const LINKS = [
  { label: 'The Drop', href: '#reveal' },
  { label: 'The Hoodie', href: '#hoodie' },
  { label: 'Story', href: '#story' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'border-b border-white/5 bg-ink-950/70 backdrop-blur-lg'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#top" className="group flex items-center gap-2" aria-label="VYBE home">
          <Image
            src="/vybe-logo.png"
            alt="VYBE"
            width={40}
            height={40}
            priority
            className="h-9 w-9 transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-110"
          />
          <span className="font-display text-lg tracking-tight text-chalk">
            VYBE<span className="text-vybe">.</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-chalk/60 transition-colors hover:text-vybe"
            >
              {l.label}
            </a>
          ))}
        </div>

        <a
          href="#drop"
          className="border border-vybe/60 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-vybe transition-all hover:bg-vybe hover:text-ink-950"
        >
          Shop Drop
        </a>
      </nav>
    </header>
  );
}
