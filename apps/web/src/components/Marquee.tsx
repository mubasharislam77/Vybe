const ITEMS = [
  'DESI ROOTS',
  'GLOBAL VIBE',
  'PREMIUM FABRIC',
  'MADE FOR THE CULTURE',
  'WESTERN TARKA',
];

export default function Marquee() {
  const strip = [...ITEMS, ...ITEMS];
  return (
    <div className="border-y border-white/10 bg-vybe py-4 text-ink-950">
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {strip.map((item, i) => (
          <span key={i} className="mx-6 font-display text-lg tracking-tight md:text-2xl">
            {item}
            <span className="mx-6 text-ink-950/40">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
