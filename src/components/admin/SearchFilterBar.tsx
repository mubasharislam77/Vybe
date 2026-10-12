import { inputClass, smallButtonClass } from './styles';

export interface FilterSelect {
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
}

/** Plain GET form — filters live in the URL so pages are linkable and refresh-safe. */
export function SearchFilterBar({
  basePath,
  q,
  placeholder = 'Search…',
  selects = [],
  hiddenParams = {},
}: {
  basePath: string;
  q?: string;
  placeholder?: string;
  selects?: FilterSelect[];
  hiddenParams?: Record<string, string | undefined>;
}) {
  const hasFilters = Boolean(q) || selects.some((s) => s.value);
  return (
    <form action={basePath} method="get" className="mb-4 flex flex-wrap items-end gap-2">
      {Object.entries(hiddenParams).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <label className="flex min-w-[220px] flex-1 flex-col gap-1">
        <span className="sr-only">Search</span>
        <input type="search" name="q" defaultValue={q ?? ''} placeholder={placeholder} className={inputClass} />
      </label>
      {selects.map((select) => (
        <label key={select.name} className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest2 text-ink-400">{select.label}</span>
          <select name={select.name} defaultValue={select.value ?? ''} className={`${inputClass} w-auto min-w-[150px]`}>
            <option value="">All</option>
            {select.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button type="submit" className={`${smallButtonClass} min-h-[40px]`}>
        Apply
      </button>
      {hasFilters && (
        <a href={basePath} className={`${smallButtonClass} min-h-[40px] border-transparent`}>
          Clear
        </a>
      )}
    </form>
  );
}
