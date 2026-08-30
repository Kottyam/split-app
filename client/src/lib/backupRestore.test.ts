import { describe, it, expect, beforeEach } from 'vitest';
import { generateBackupPayload, validateBackupJson } from './backupRestore';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

describe('Kharcha Backup & Restore Validation', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: new MemoryStorage() });
  });

  it('generates a valid backup payload structure', () => {
    const payload = generateBackupPayload();
    expect(payload.app).toBe('Kharcha');
    expect(payload.backupVersion).toBe(1);
    expect(payload.data).toBeDefined();
    expect(Array.isArray(payload.data.trips)).toBe(true);
    expect(Array.isArray(payload.data.sharedHomes)).toBe(true);
    expect(Array.isArray(payload.data.groupFunds)).toBe(true);
    expect(payload.data.personalBudget).toBeDefined();
  });

  it('validates correct and corrupted backup JSON strings', () => {
    const payload = generateBackupPayload();
    const jsonStr = JSON.stringify(payload);

    const validation = validateBackupJson(jsonStr);
    expect(validation.valid).toBe(true);
    expect(validation.summary).toBeDefined();

    const badValidation = validateBackupJson('{"app":"OtherApp"}');
    expect(badValidation.valid).toBe(false);

    const corruptValidation = validateBackupJson('not json');
    expect(corruptValidation.valid).toBe(false);
  });
});
