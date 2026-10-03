type BadgeTone = 'lime' | 'burgundy' | 'ink' | 'outline';

const tones: Record<BadgeTone, string> = {
  lime: 'bg-lime text-ink',
  burgundy: 'bg-burgundy text-ivory',
  ink: 'bg-ink text-ivory',
  outline: 'border border-ink/30 text-ink',
};

export function Badge({ tone = 'ink', children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={`inline-block px-2 py-1 text-[10px] font-semibold uppercase tracking-widest2 ${tones[tone]}`}>
      {children}
    </span>
  );
}
