'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveCategory } from '@/lib/actions/admin/catalog.actions';
import { slugify } from '@/lib/utils/slug';
import { TextField, TextAreaField, SelectField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '../FormMessage';

export interface CategoryFormValues {
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
  description?: string;
  imageUrl?: string;
}

export function CategoryForm({
  categoryId,
  initial,
  parentOptions,
  onSaved,
}: {
  categoryId: string | null;
  initial?: CategoryFormValues;
  parentOptions: { id: string; name: string }[];
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [parentId, setParentId] = useState(initial?.parentId ?? '');
  const [order, setOrder] = useState(String(initial?.order ?? 0));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await saveCategory(categoryId, {
      name,
      slug,
      parentId: parentId || null,
      order: Number(order) || 0,
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    });
    setSubmitting(false);
    if (!result.success) {
      setError(result.errorMessage ?? 'Could not save.');
      return;
    }
    if (!categoryId) {
      setName('');
      setSlug('');
      setSlugTouched(false);
      setDescription('');
      setImageUrl('');
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
      <SelectField label="Parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
        <option value="">— Top level —</option>
        {parentOptions
          .filter((p) => p.id !== categoryId)
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
      </SelectField>
      <TextField label="Sort order" type="number" value={order} onChange={(e) => setOrder(e.target.value)} hint="Lower numbers appear first" />
      <div className="sm:col-span-2">
        <TextField label="Image URL" type="text" value={imageUrl} hint="https://… or /products/…" onChange={(e) => setImageUrl(e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <TextAreaField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={500} />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Saving…' : categoryId ? 'Save category' : 'Add category'}
        </Button>
        <FormMessage error={error} />
      </div>
    </form>
  );
}
