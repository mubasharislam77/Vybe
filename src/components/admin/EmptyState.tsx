export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <p className="font-display text-base uppercase tracking-widest2 text-ink">{title}</p>
      {hint && <p className="max-w-md text-sm text-ink-600">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
