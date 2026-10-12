'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveCollection } from '@/lib/actions/admin/catalog.actions';
import { slugify } from '@/lib/utils/slug';
import { TextField, TextAreaField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '../FormMessage';

export interface CollectionFormValues {
  name: string;
  slug: string;
  description?: string;
  bannerImageUrl?: string;
  isActive: boolean;
  startsAt?: string; // datetime-local value
  endsAt?: string;
}

export function CollectionForm({
  collectionId,
  initial,
  onSaved,
}: {
  collectionId: string | null;
  initial?: CollectionFormValues;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [bannerImageUrl, setBannerImageUrl] = useState(initial?.bannerImageUrl ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [startsAt, setStartsAt] = useState(initial?.startsAt ?? '');
  const [endsAt, setEndsAt] = useState(initial?.endsAt ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await saveCollection(collectionId, {
      name,
      slug,
      description: description.trim() || undefined,
      bannerImageUrl: bannerImageUrl.trim() || undefined,
      isActive,
      startsAt: startsAt || undefined,
      endsAt: endsAt || undefined,
    });
    setSubmitting(false);
    if (!result.success) {
      setError(result.errorMessage ?? 'Could not save.');
      return;
    }
    if (!collectionId) {
      setName('');
      setSlug('');
      setSlugTouched(false);
      setDescription('');
      setBannerImageUrl('');
      setStartsAt('');
      setEndsAt('');
    }
    onSaved?.();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <TextField
        label="Name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (!slugTouched) setSlug(slugify(e.target.value));
        }}
        required
      />
      <TextField
        label="Slug"
        value={slug}
        onChange={(e) => {
          setSlugTouched(true);
          setSlug(e.target.value);
        }}
        required
      />
      <TextField label="Starts" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
      <TextField label="Ends" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
      <div className="sm:col-span-2">
        <TextField label="Banner image URL" type="text" value={bannerImageUrl} hint="https://… or /products/…" onChange={(e) => setBannerImageUrl(e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <TextAreaField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={500} />
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-ink" />
        Active (visible on the storefront)
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Saving…' : collectionId ? 'Save collection' : 'Add collection'}
        </Button>
        <FormMessage error={error} />
      </div>
    </form>
  );
}
