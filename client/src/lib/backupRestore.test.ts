import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
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

describe('Backup export download path', () => {
  const read = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

  it('saves the backup through downloadBlobFile so the Android app can write to Downloads', () => {
    const settings = read('client/src/components/AppSettingsDialogExtended.tsx');
    expect(settings).toContain("import { downloadBlobFile } from '@/lib/fileDownload'");
    expect(settings).toContain('await downloadBlobFile(blob, filename)');
    expect(settings).not.toContain('URL.createObjectURL');
  });
});

