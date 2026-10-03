type ShapeColor = 'lime' | 'burgundy' | 'ivory' | 'ink';

const colorClass: Record<ShapeColor, string> = {
  lime: 'border-lime',
  burgundy: 'border-burgundy',
  ivory: 'border-ivory',
  ink: 'border-ink',
};
const fillClass: Record<ShapeColor, string> = {
  lime: 'bg-lime',
  burgundy: 'bg-burgundy',
  ivory: 'bg-ivory',
  ink: 'bg-ink',
};

export function RingShape({ size = 240, color = 'lime', opacity = 0.15 }: { size?: number; color?: ShapeColor; opacity?: number }) {
  return (
    <div
      className={`rounded-full border-[3px] ${colorClass[color]}`}
      style={{ width: size, height: size, opacity }}
    />
  );
}

export function PlusShape({ size = 48, color = 'burgundy', opacity = 0.25 }: { size?: number; color?: ShapeColor; opacity?: number }) {
  const thickness = Math.max(3, Math.round(size * 0.14));
  return (
    <div className="relative" style={{ width: size, height: size, opacity }}>
      <div className={`absolute left-1/2 top-0 -translate-x-1/2 ${fillClass[color]}`} style={{ width: thickness, height: size }} />
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 ${fillClass[color]}`} style={{ width: size, height: thickness }} />
    </div>
  );
}

export function DiamondShape({ size = 32, color = 'lime', opacity = 0.3 }: { size?: number; color?: ShapeColor; opacity?: number }) {
  return (
    <div
      className={`rotate-45 ${fillClass[color]}`}
      style={{ width: size, height: size, opacity }}
    />
  );
}

export function SquareOutline({ size = 160, color = 'ivory', opacity = 0.12 }: { size?: number; color?: ShapeColor; opacity?: number }) {
  return <div className={`border-[3px] ${colorClass[color]}`} style={{ width: size, height: size, opacity }} />;
}
