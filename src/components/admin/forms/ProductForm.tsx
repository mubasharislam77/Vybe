'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductInput } from '@/lib/validation/product';
import { saveProduct, deleteProduct } from '@/lib/actions/admin/products.actions';
import { slugify } from '@/lib/utils/slug';
import { TextField, TextAreaField, SelectField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { ImageUploader, type ImageDraft } from './ImageUploader';
import { FormMessage } from '../FormMessage';
import { inputClass, labelClass, smallButtonClass, panelPadClass } from '../styles';

interface VariantDraft {
  key: string;
  sku: string;
  size: string;
  colorName: string;
  colorSwatchHex: string;
  priceRupees: string;
  compareAtRupees: string;
  stock: string;
  images: ImageDraft[];
}

interface Option {
  id: string;
  name: string;
  group?: string;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size'];

function newKey() {
  return Math.random().toString(36).slice(2, 10);
}

function toDraftVariant(v?: ProductInput['variants'][number]): VariantDraft {
  return {
    key: newKey(),
    sku: v?.sku ?? '',
    size: v?.size ?? 'M',
    colorName: v?.colorName ?? '',
    colorSwatchHex: v?.colorSwatchHex ?? '#171717',
    priceRupees: v ? String(v.priceMinor / 100) : '',
    compareAtRupees: v?.compareAtPriceMinor ? String(v.compareAtPriceMinor / 100) : '',
    stock: v ? String(v.stock) : '0',
    images: v?.images ?? [],
  };
}

function rupeesToMinor(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return undefined;
  return Math.round(n * 100);
}

function blankToUndefined(value: string): string | undefined {
  const t = value.trim();
  return t ? t : undefined;
}

export function ProductForm({
  productId,
  initial,
  categories,
  collections,
  canDelete,
}: {
  productId: string | null;
  initial: ProductInput | null;
  categories: Option[];
  collections: Option[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<ProductInput['status']>(initial?.status ?? 'draft');
  const [audience, setAudience] = useState<ProductInput['audience']>(initial?.audience ?? 'unisex');
  const [fulfillment, setFulfillment] = useState<ProductInput['fulfillment']>(initial?.fulfillment ?? 'ready_stock');
  const [leadTime, setLeadTime] = useState(initial?.productionLeadTimeDays ? String(initial.productionLeadTimeDays) : '');
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [categoryIds, setCategoryIds] = useState<string[]>(initial?.categoryIds ?? []);
  const [collectionIds, setCollectionIds] = useState<string[]>(initial?.collectionIds ?? []);
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(', '));
  const [images, setImages] = useState<ImageDraft[]>(initial?.images ?? []);
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? '');
  const [fabric, setFabric] = useState(initial?.fabric ?? '');
  const [fit, setFit] = useState(initial?.fit ?? '');
  const [care, setCare] = useState(initial?.careInstructions ?? '');
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? '');
  const [variants, setVariants] = useState<VariantDraft[]>(
    initial?.variants.length ? initial.variants.map(toDraftVariant) : [toDraftVariant()],
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const skuPrefix = useMemo(() => (slug || slugify(title)).toUpperCase().replace(/-/g, '').slice(0, 10) || 'VYB', [slug, title]);

  function handleTitle(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function toggleIn(list: string[], id: string, setter: (v: string[]) => void) {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function updateVariant(key: string, patch: Partial<VariantDraft>) {
    setVariants((prev) => prev.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  }

  function generateSku(v: VariantDraft): string {
    const color = v.colorName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'CLR';
    const size = v.size.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'OS';
    return `${skuPrefix}-${color}-${size}`;
  }

  function buildPayload(): ProductInput {
    const tags = tagsText
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    return {
      slug: slug.trim(),
      title: title.trim(),
      description: description.trim(),
      status,
      audience,
      fulfillment,
      productionLeadTimeDays: fulfillment === 'made_to_order' && leadTime ? Number(leadTime) : undefined,
      featured,
      categoryIds,
      collectionIds,
      tags,
      images: images.map((img, i) => ({ ...img, order: i })),
      videoUrl: blankToUndefined(videoUrl),
      fabric: blankToUndefined(fabric),
      fit: blankToUndefined(fit),
      careInstructions: blankToUndefined(care),
      seoTitle: blankToUndefined(seoTitle),
      seoDescription: blankToUndefined(seoDescription),
      variants: variants.map((v) => ({
        sku: v.sku.trim(),
        size: v.size.trim(),
        colorName: v.colorName.trim(),
        colorSwatchHex: v.colorSwatchHex,
        priceMinor: rupeesToMinor(v.priceRupees) ?? 0,
        compareAtPriceMinor: rupeesToMinor(v.compareAtRupees),
        stock: Number(v.stock) || 0,
        images: v.images,
      })),
    };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const result = await saveProduct(productId, buildPayload());
    setSubmitting(false);
    if (!result.success || !result.data) {
      setError(result.errorMessage ?? 'Could not save product.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (productId === null) {
      router.push(`/admin/products/${result.data.id}/edit?created=1`);
    } else {
      setSuccess('Product saved.');
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!productId) return;
    if (!window.confirm('Delete this product permanently? Unpublishing is safer if it has ever sold.')) return;
    const result = await deleteProduct(productId);
    if (!result.success) {
      setError(result.errorMessage ?? 'Could not delete.');
      return;
    }
    router.push('/admin/products');
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Option[]>();
    for (const c of categories) {
      const g = c.group ?? '';
      map.set(g, [...(map.get(g) ?? []), c]);
    }
    return Array.from(map.entries());
  }, [categories]);

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-6">
        <FormMessage error={error} success={success} />

        <section className={panelPadClass}>
          <h2 className="mb-4 font-display text-sm uppercase tracking-widest2">Basics</h2>
          <div className="grid gap-4">
            <TextField label="Title" value={title} onChange={(e) => handleTitle(e.target.value)} required maxLength={150} />
            <TextField
              label="Slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              hint="Lowercase, hyphenated. Becomes the product URL: /products/<slug>"
              required
            />
            <TextAreaField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={6} />
            <TextField label="Tags" value={tagsText} onChange={(e) => setTagsText(e.target.value)} hint="Comma-separated, e.g. oversized, graphic, drop-01" />
          </div>
        </section>

        <section className={panelPadClass}>
          <h2 className="mb-4 font-display text-sm uppercase tracking-widest2">Images</h2>
          <ImageUploader images={images} onChange={setImages} defaultAlt={title} />
        </section>

        <section className={panelPadClass}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm uppercase tracking-widest2">Variants</h2>
            <button type="button" onClick={() => setVariants((prev) => [...prev, toDraftVariant()])} className={smallButtonClass}>
              + Add variant
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {variants.map((v, index) => (
              <div key={v.key} className="grid gap-3 border border-ink/10 bg-ivory p-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex flex-col gap-1 text-xs lg:col-span-2">
                  <span className={labelClass}>SKU</span>
                  <div className="flex gap-1">
                    <input value={v.sku} onChange={(e) => updateVariant(v.key, { sku: e.target.value })} className={inputClass} required placeholder="e.g. HOOD-BLK-M" />
                    <button type="button" onClick={() => updateVariant(v.key, { sku: generateSku(v) })} className={`${smallButtonClass} shrink-0`} title="Generate from slug/color/size">
                      Auto
                    </button>
                  </div>
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className={labelClass}>Size</span>
                  <input list="vybe-sizes" value={v.size} onChange={(e) => updateVariant(v.key, { size: e.target.value })} className={inputClass} required />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className={labelClass}>Colour</span>
                  <div className="flex gap-1">
                    <input value={v.colorName} onChange={(e) => updateVariant(v.key, { colorName: e.target.value })} className={inputClass} required placeholder="Black" />
                    <input type="color" value={v.colorSwatchHex} onChange={(e) => updateVariant(v.key, { colorSwatchHex: e.target.value })} className="h-10 w-12 shrink-0 cursor-pointer border border-ink/20 bg-white p-0.5" aria-label="Swatch colour" />
                  </div>
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className={labelClass}>Price (PKR)</span>
                  <input type="number" min={1} step="1" value={v.priceRupees} onChange={(e) => updateVariant(v.key, { priceRupees: e.target.value })} className={inputClass} required />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className={labelClass}>Compare-at (PKR)</span>
                  <input type="number" min={0} step="1" value={v.compareAtRupees} onChange={(e) => updateVariant(v.key, { compareAtRupees: e.target.value })} className={inputClass} placeholder="Optional — shows as sale" />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className={labelClass}>Stock</span>
                  <input type="number" min={0} step="1" value={v.stock} onChange={(e) => updateVariant(v.key, { stock: e.target.value })} className={inputClass} disabled={fulfillment === 'made_to_order'} />
                </label>
                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => setVariants((prev) => prev.filter((x) => x.key !== v.key))}
                    disabled={variants.length === 1}
                    className={`${smallButtonClass} text-burgundy`}
                  >
                    Remove #{index + 1}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <datalist id="vybe-sizes">
            {SIZES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {fulfillment === 'made_to_order' && (
            <p className="mt-3 text-xs text-ink-600">Made-to-order products aren&apos;t limited by stock; the stock field is ignored.</p>
          )}
        </section>

        <section className={panelPadClass}>
          <h2 className="mb-4 font-display text-sm uppercase tracking-widest2">Details &amp; SEO</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Fabric" value={fabric} onChange={(e) => setFabric(e.target.value)} maxLength={300} />
            <TextField label="Fit" value={fit} onChange={(e) => setFit(e.target.value)} maxLength={300} />
            <div className="sm:col-span-2">
              <TextAreaField label="Care instructions" value={care} onChange={(e) => setCare(e.target.value)} rows={3} maxLength={1000} />
            </div>
            <TextField label="Video URL" type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
            <TextField label="SEO title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={70} hint={`${seoTitle.length}/70`} />
            <div className="sm:col-span-2">
              <TextAreaField label="SEO description" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={2} maxLength={160} hint={`${seoDescription.length}/160`} />
            </div>
          </div>
        </section>
      </div>

      <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
        <section className={panelPadClass}>
          <h2 className="mb-4 font-display text-sm uppercase tracking-widest2">Publishing</h2>
          <div className="flex flex-col gap-4">
            <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as ProductInput['status'])}>
              <option value="draft">Draft (hidden)</option>
              <option value="published">Published</option>
            </SelectField>
            <SelectField label="Audience" value={audience} onChange={(e) => setAudience(e.target.value as ProductInput['audience'])}>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="unisex">Unisex</option>
            </SelectField>
            <SelectField label="Fulfillment" value={fulfillment} onChange={(e) => setFulfillment(e.target.value as ProductInput['fulfillment'])}>
              <option value="ready_stock">Ready stock</option>
              <option value="made_to_order">Made to order</option>
            </SelectField>
            {fulfillment === 'made_to_order' && (
              <TextField label="Production lead time (days)" type="number" min={1} max={180} value={leadTime} onChange={(e) => setLeadTime(e.target.value)} required />
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-ink" />
              Featured on homepage
            </label>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Saving…' : productId ? 'Save changes' : 'Create product'}
            </Button>
            {productId && canDelete && (
              <button type="button" onClick={handleDelete} className="text-xs text-burgundy underline underline-offset-4">
                Delete product
              </button>
            )}
          </div>
        </section>

        <section className={panelPadClass}>
          <h2 className="mb-3 font-display text-sm uppercase tracking-widest2">Categories</h2>
          {categories.length === 0 ? (
            <p className="text-xs text-ink-400">No categories yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {grouped.map(([group, items]) => (
                <div key={group || 'root'}>
                  {group && <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest2 text-ink-400">{group}</p>}
                  <ul className="flex flex-col gap-1">
                    {items.map((c) => (
                      <li key={c.id}>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={categoryIds.includes(c.id)} onChange={() => toggleIn(categoryIds, c.id, setCategoryIds)} className="h-4 w-4 accent-ink" />
                          {c.name}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={panelPadClass}>
          <h2 className="mb-3 font-display text-sm uppercase tracking-widest2">Collections</h2>
          {collections.length === 0 ? (
            <p className="text-xs text-ink-400">No collections yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {collections.map((c) => (
                <li key={c.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={collectionIds.includes(c.id)} onChange={() => toggleIn(collectionIds, c.id, setCollectionIds)} className="h-4 w-4 accent-ink" />
                    {c.name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </form>
  );
}
