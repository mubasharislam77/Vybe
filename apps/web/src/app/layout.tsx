import type { Metadata, Viewport } from 'next';
import { Archivo_Black, Space_Grotesk } from 'next/font/google';
import './globals.css';

const display = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VYBE — Desi Roots. Global Vibe.',
  description:
    'VYBE is Pakistani streetwear with a western tarka. Premium heavyweight hoodies, sweatshirts and tees — built for the culture.',
  keywords: ['VYBE', 'Pakistani streetwear', 'hoodies', 'premium fabric', 'desi fashion'],
  openGraph: {
    title: 'VYBE — Desi Roots. Global Vibe.',
    description: 'Pakistani streetwear with a western tarka.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#08080a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body grain antialiased">{children}</body>
    </html>
  );
}
