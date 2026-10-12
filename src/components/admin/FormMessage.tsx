export function FormMessage({ error, success }: { error?: string | null; success?: string | null }) {
  if (error) {
    return (
      <p role="alert" className="border border-burgundy/30 bg-burgundy/5 px-3 py-2 text-sm text-burgundy">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p role="status" className="border border-lime-dark/40 bg-lime/20 px-3 py-2 text-sm text-ink">
        {success}
      </p>
    );
  }
  return null;
}
