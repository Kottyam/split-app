import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadBlobFile, shareBlobFile } from './fileDownload';
import { kharchaFileName, shareKharchaFile } from '@/sync/shareOut';

const g = globalThis as any;
const setWindow = (w: any) => { g.window = w; };

afterEach(() => { delete g.window; vi.restoreAllMocks(); });

describe('Android file bridge', () => {
  it('saves to Downloads through KharchaFiles with a plain MIME type and base64 body', async () => {
    const saveBase64File = vi.fn(() => true);
    setWindow({ KharchaFiles: { saveBase64File } });
    const ok = await downloadBlobFile(new Blob(['{"a":1}'], { type: 'application/json;charset=utf-8' }), 'Kharcha_Backup.json');
    expect(ok).toBe(true);
    expect(saveBase64File).toHaveBeenCalledWith('Kharcha_Backup.json', 'application/json', btoa('{"a":1}'));
  });

  it('throws when the native save fails so the UI can show an error', async () => {
    setWindow({ KharchaFiles: { saveBase64File: () => false } });
    await expect(downloadBlobFile(new Blob(['x']), 'a.json')).rejects.toThrow();
  });

  it('opens the native share sheet for a file when the Android app supports it', async () => {
    const shareBase64File = vi.fn(() => true);
    setWindow({ KharchaFiles: { saveBase64File: vi.fn(), shareBase64File } });
    const result = await shareBlobFile(new Blob(['hello'], { type: 'application/octet-stream' }), 'Fund-edit.kharcha', 'Office Fund');
    expect(result).toBe('shared');
    expect(shareBase64File).toHaveBeenCalledWith('Fund-edit.kharcha', 'application/octet-stream', btoa('hello'), 'Office Fund');
  });

  it('reports unsupported when there is no bridge and no Web Share API', async () => {
    setWindow({});
    expect(await shareBlobFile(new Blob(['x']), 'a.kharcha', 't')).toBe('unsupported');
  });
});

describe('Group Fund .kharcha file sharing', () => {
  it('uses the share sheet (WhatsApp, any app) in the Android app', async () => {
    const shareBase64File = vi.fn(() => true);
    const saveBase64File = vi.fn(() => true);
    setWindow({ KharchaFiles: { shareBase64File, saveBase64File } });
    expect(await shareKharchaFile('Office Fund-edit', '{"kharcha":1}', 'Office Fund')).toBe('shared');
    expect(shareBase64File.mock.calls[0][0]).toBe('Office-Fund-edit.kharcha');
    expect(saveBase64File).not.toHaveBeenCalled();
  });

  it('falls back to saving in Downloads on older app builds without the share bridge', async () => {
    const saveBase64File = vi.fn(() => true);
    setWindow({ KharchaFiles: { saveBase64File } });
    expect(await shareKharchaFile('Fund', '{}', 'Fund')).toBe('saved-native');
    expect(saveBase64File).toHaveBeenCalledWith('Fund.kharcha', 'application/octet-stream', btoa('{}'));
  });

  it('builds safe .kharcha names', () => {
    expect(kharchaFileName('Onam / Office: Fund')).toBe('Onam-Office-Fund.kharcha');
    expect(kharchaFileName('***')).toBe('kharcha.kharcha');
  });
});
