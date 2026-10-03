/**
 * Normalizes a Pakistani mobile number to E.164 (+923XXXXXXXXX).
 * Accepts: 03001234567, 3001234567, 923001234567, +923001234567, with
 * optional spaces/dashes. Pakistani mobile numbers are 10 digits starting
 * with 3 after the country code. Returns null if the input doesn't match.
 */
export function normalizePakistaniPhone(input: string): string | null {
  const cleaned = input.replace(/[\s()-]/g, '');

  let digits: string | null = null;
  if (/^\+92[0-9]{10}$/.test(cleaned)) {
    digits = cleaned.slice(3);
  } else if (/^0092[0-9]{10}$/.test(cleaned)) {
    digits = cleaned.slice(4);
  } else if (/^92[0-9]{10}$/.test(cleaned)) {
    digits = cleaned.slice(2);
  } else if (/^0[0-9]{10}$/.test(cleaned)) {
    digits = cleaned.slice(1);
  } else if (/^[0-9]{10}$/.test(cleaned)) {
    digits = cleaned;
  }

  if (!digits || !/^3[0-9]{9}$/.test(digits)) return null;
  return `+92${digits}`;
}

export function isValidE164(value: string): boolean {
  return /^\+[1-9][0-9]{7,14}$/.test(value);
}
