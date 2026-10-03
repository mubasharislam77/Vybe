import type { Metadata, Viewport } from 'next';
import { Anton, Inter } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const display = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'VybeTheBrand — Pakistani Streetwear',
    template: '%s — VybeTheBrand',
  },
  description:
    'VybeTheBrand is Pakistani streetwear for the expressive and unapologetic — oversized tees, hoodies, and sweatshirts built for the culture.',
  keywords: ['VybeTheBrand', 'Pakistani streetwear', 'hoodies', 'oversized tees', 'desi fashion'],
  openGraph: {
    title: 'VybeTheBrand — Pakistani Streetwear',
    description: 'Oversized tees, hoodies, and sweatshirts built for the culture.',
    type: 'website',
    siteName: 'VybeTheBrand',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#171717',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
