/** All amounts are stored as integer minor units (1 PKR = 100 paisa). */

export function toMinor(rupees: number): number {
  return Math.round(rupees * 100);
}

export function toMajor(minor: number): number {
  return minor / 100;
}

export function formatPKR(minor: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(toMajor(minor));
}

export function percentOf(minor: number, percent: number): number {
  return Math.round((minor * percent) / 100);
}
