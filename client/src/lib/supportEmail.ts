export const SUPPORT_EMAIL_STORAGE_KEY = 'kharcha_support_email';
export const DEFAULT_SUPPORT_EMAIL = 'amaltms@gmail.com';

export function normalizeSupportEmail(value: string): string {
  return value.trim();
}

export function isValidSupportEmail(value: string): boolean {
  const normalized = normalizeSupportEmail(value);
  return normalized === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function getSupportEmail(storage: Pick<Storage, 'getItem'> = localStorage): string {
  const stored = storage.getItem(SUPPORT_EMAIL_STORAGE_KEY);
  return stored === null ? DEFAULT_SUPPORT_EMAIL : stored;
}

export function saveSupportEmail(value: string, storage: Pick<Storage, 'setItem' | 'removeItem'> = localStorage): string {
  const normalized = normalizeSupportEmail(value);
  if (!isValidSupportEmail(normalized)) {
    throw new Error('Please enter a valid email address or leave it blank.');
  }
  if (normalized) {
    storage.setItem(SUPPORT_EMAIL_STORAGE_KEY, normalized);
  } else {
    storage.removeItem(SUPPORT_EMAIL_STORAGE_KEY);
  }
  return normalized;
}
