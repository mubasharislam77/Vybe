'use client';

import { useEffect, useState } from 'react';
import { getAdminMediaUploadParams } from '@/lib/actions/media.actions';
import { inputClass, smallButtonClass } from '../styles';

export interface ImageDraft {
  url: string;
  publicId: string;
  alt: string;
  order: number;
}

async function uploadToCloudinary(file: File): Promise<{ url: string; publicId: string }> {
  const signed = await getAdminMediaUploadParams();
  if (!signed.configured || !signed.params) throw new Error('Cloudinary is not configured');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signed.params.apiKey);
  formData.append('timestamp', String(signed.params.timestamp));
  formData.append('signature', signed.params.signature);
  formData.append('folder', signed.params.folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${signed.params.cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? 'Upload failed');
  return { url: json.secure_url as string, publicId: json.public_id as string };
}

/**
 * Product gallery editor. Files go straight from the browser to Cloudinary
 * using a server-signed request; when Cloudinary isn't configured, images
 * can still be added by URL (publicId becomes a synthetic `external:` key).
 */
export function ImageUploader({
  images,
  onChange,
  defaultAlt,
}: {
  images: ImageDraft[];
  onChange: (next: ImageDraft[]) => void;
  defaultAlt: string;
}) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    getAdminMediaUploadParams()
      .then((r) => setConfigured(r.configured))
      .catch(() => setConfigured(false));
  }, []);

  function reindex(list: ImageDraft[]): ImageDraft[] {
    return list.map((img, i) => ({ ...img, order: i }));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const added: ImageDraft[] = [];
      for (const file of Array.from(files)) {
        const { url, publicId } = await uploadToCloudinary(file);
        added.push({ url, publicId, alt: defaultAlt || file.name, order: 0 });
      }
      onChange(reindex([...images, ...added]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  function addByUrl() {
    const url = urlInput.trim();
    if (!/^https?:\/\/\S+$/.test(url) && !/^\/[^/\s]\S*$/.test(url)) {
      setError('Enter a full image URL (https://…) or a root-relative path like /products/tee-01.jpg');
      return;
    }
    setError(null);
    onChange(reindex([...images, { url, publicId: `external:${Date.now().toString(36)}`, alt: defaultAlt || 'Product image', order: 0 }]));
    setUrlInput('');
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(reindex(next));
  }

  function remove(index: number) {
    onChange(reindex(images.filter((_, i) => i !== index)));
  }

  function setAlt(index: number, alt: string) {
    onChange(images.map((img, i) => (i === index ? { ...img, alt } : img)));
  }

  return (
    <div className="flex flex-col gap-3">
      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <li key={`${img.publicId}-${i}`} className="flex flex-col gap-2 border border-ink/10 bg-ivory p-2">
              <div className="relative aspect-[4/5] overflow-hidden bg-ink/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt} className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1 top-1 bg-lime px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest2 text-ink">
                    Cover
                  </span>
                )}
              </div>
              <input
                type="text"
                value={img.alt}
                onChange={(e) => setAlt(i, e.target.value)}
                placeholder="Alt text"
                aria-label={`Alt text for image ${i + 1}`}
                className={`${inputClass} min-h-[32px] px-2 py-1 text-xs`}
              />
              <div className="flex justify-between gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={`${smallButtonClass} min-h-[28px] px-2`} aria-label="Move earlier">
                  ←
                </button>
                <button type="button" onClick={() => remove(i)} className={`${smallButtonClass} min-h-[28px] px-2 text-burgundy`}>
                  Remove
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className={`${smallButtonClass} min-h-[28px] px-2`} aria-label="Move later">
                  →
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-400">No images yet. The first image is the cover shown on listing cards.</p>
      )}

      <div className="flex flex-col gap-2 border border-dashed border-ink/20 p-3">
        {configured === false && (
          <p className="text-xs text-ink-600">
            Cloudinary isn&apos;t configured (set CLOUDINARY_* env vars to enable direct uploads). You can still add images by URL.
          </p>
        )}
        {configured !== false && (
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold uppercase tracking-widest2 text-ink-600">Upload files</span>
            <input type="file" accept="image/*" multiple disabled={busy || configured === null} onChange={(e) => handleFiles(e.target.files)} className="text-sm" />
          </label>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://… or /products/… image URL"
            className={inputClass}
          />
          <button type="button" onClick={addByUrl} className={smallButtonClass}>
            Add URL
          </button>
        </div>
        {busy && <p className="text-xs text-ink-600">Uploading…</p>}
        {error && (
          <p role="alert" className="text-xs text-burgundy">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
