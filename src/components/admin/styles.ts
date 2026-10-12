/** Shared admin class strings — one place to tune the portal's density/look. */
export const panelClass = 'border border-ink/10 bg-white';
export const panelPadClass = `${panelClass} p-5 sm:p-6`;
/** `relative` matters: Tailwind's sr-only is position:absolute, and an unpositioned scroll container lets it escape clipping and widen the page on phones. */
export const tableWrapClass = `${panelClass} relative min-w-0 overflow-x-auto`;
export const tableClass = 'w-full min-w-[640px] text-left text-sm';
export const thClass = 'border-b border-ink/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-widest2 text-ink-400';
export const tdClass = 'border-b border-ink/5 px-4 py-3 align-middle';
export const inputClass =
  'min-h-[40px] w-full border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:bg-ink/5';
export const labelClass = 'text-xs font-semibold uppercase tracking-widest2 text-ink-600';
export const linkClass = 'text-ink underline underline-offset-4 hover:text-burgundy';
/** Layout-only part of the small button, no colours — ActionButton adds its own per variant. */
export const smallButtonBaseClass =
  'inline-flex min-h-[36px] items-center justify-center gap-1.5 border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';
export const smallButtonClass = `${smallButtonBaseClass} border-ink/20 bg-white text-ink hover:border-ink hover:bg-ink hover:text-ivory`;
