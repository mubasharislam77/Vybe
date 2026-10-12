/** Collapsed JSON viewer for audit diffs / payloads. */
export function JsonDetails({ value, label = 'Details' }: { value: unknown; label?: string }) {
  if (value === undefined || value === null) return <span className="text-ink-400">—</span>;
  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-ink-600 underline-offset-4 hover:underline">{label}</summary>
      <pre className="mt-1 max-w-md overflow-x-auto whitespace-pre-wrap break-all bg-ink/5 p-2 font-mono text-[11px] text-ink-600">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}
