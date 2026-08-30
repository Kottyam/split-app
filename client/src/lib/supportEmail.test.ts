import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SUPPORT_EMAIL,
  SUPPORT_EMAIL_STORAGE_KEY,
  getSupportEmail,
  isValidSupportEmail,
  saveSupportEmail,
} from './supportEmail';

describe('support email settings', () => {
  it('accepts valid emails and blank values but rejects malformed values', () => {
    expect(isValidSupportEmail('help@example.com')).toBe(true);
    expect(isValidSupportEmail('   help@example.com  ')).toBe(true);
    expect(isValidSupportEmail('')).toBe(true);
    expect(isValidSupportEmail('not-an-email')).toBe(false);
  });

  it('uses the requested default address until a custom value is saved', () => {
    expect(DEFAULT_SUPPORT_EMAIL).toBe('amaltms@gmail.com');
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };

    expect(getSupportEmail(storage)).toBe(DEFAULT_SUPPORT_EMAIL);
    expect(saveSupportEmail('owner@example.com', storage)).toBe('owner@example.com');
    expect(values.get(SUPPORT_EMAIL_STORAGE_KEY)).toBe('owner@example.com');
    expect(getSupportEmail(storage)).toBe('owner@example.com');
  });

  it('removes the stored address when saved blank', () => {
    const values = new Map<string, string>([[SUPPORT_EMAIL_STORAGE_KEY, 'owner@example.com']]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };

    expect(saveSupportEmail('   ', storage)).toBe('');
    expect(values.has(SUPPORT_EMAIL_STORAGE_KEY)).toBe(false);
    expect(getSupportEmail(storage)).toBe(DEFAULT_SUPPORT_EMAIL);
  });

  it('does not save malformed addresses', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };

    expect(() => saveSupportEmail('missing-at-symbol', storage)).toThrow();
    expect(values.has(SUPPORT_EMAIL_STORAGE_KEY)).toBe(false);
  });
});
