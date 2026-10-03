import { describe, it, expect } from 'vitest';
import { signDocumentToken, verifyDocumentToken } from '../document-token';

describe('document token', () => {
  it('verifies a freshly signed token for the same order number', () => {
    const token = signDocumentToken('VYB-20250101-ABCDEF');
    expect(verifyDocumentToken('VYB-20250101-ABCDEF', token)).toBe(true);
  });

  it('rejects the token when used with a different order number', () => {
    const token = signDocumentToken('VYB-20250101-ABCDEF');
    expect(verifyDocumentToken('VYB-20250101-FFFFFF', token)).toBe(false);
  });

  it('rejects an expired token', () => {
    const token = signDocumentToken('VYB-20250101-ABCDEF', -1);
    expect(verifyDocumentToken('VYB-20250101-ABCDEF', token)).toBe(false);
  });

  it('rejects a tampered signature', () => {
    const token = signDocumentToken('VYB-20250101-ABCDEF');
    const [expires] = token.split('.');
    const tampered = `${expires}.tampered-signature`;
    expect(verifyDocumentToken('VYB-20250101-ABCDEF', tampered)).toBe(false);
  });
});
