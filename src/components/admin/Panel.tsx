import { panelClass } from './styles';

export function Panel({
  title,
  description,
  actions,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${panelClass} relative min-w-0 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-col gap-2 border-b border-ink/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h2 className="font-display text-sm uppercase tracking-widest2 text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-ink-600">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
