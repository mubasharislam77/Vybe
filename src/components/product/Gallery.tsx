'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export interface GalleryImage {
  url: string;
  alt: string;
}

export function Gallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const safeImages = images.length > 0 ? images : [{ url: '/products/tee-01.jpg', alt: title }];
  const current = safeImages[Math.min(active, safeImages.length - 1)];

  useEffect(() => {
    setActive(0);
  }, [images]);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [zoomed]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        className="relative block aspect-[3/4] w-full overflow-hidden bg-ink/5"
        aria-label={`Zoom in on ${current.alt}`}
      >
        <Image
          src={current.url}
          alt={current.alt}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover"
        />
      </button>

      {safeImages.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {safeImages.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={`relative aspect-square overflow-hidden border-2 ${i === active ? 'border-ink' : 'border-transparent'}`}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — zoomed image`}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4"
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Close zoomed image"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center text-3xl text-ivory"
          >
            ×
          </button>
          <div className="relative h-full max-h-[85vh] w-full max-w-3xl">
            <Image src={current.url} alt={current.alt} fill sizes="90vw" className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
