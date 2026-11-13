import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');

describe('share routes accept #payload links', () => {
  it('routes /s/f, /s/t, /s/e and /s/u with the payload in the path or after #', () => {
    const app = read('client/src/App.tsx');
    const routes = [...app.matchAll(/<Route path=\{(\/\^\\\/s\\\/[^}]+\/)\} component=\{(\w+)\} \/>/g)].map(m => ({ re: eval(m[1]) as RegExp, component: m[2] }));
    const match = (path: string) => routes.find(r => r.re.test(path))?.component;
    expect(match('/s/f')).toBe('ShortShareView');
    expect(match('/s/t')).toBe('ShortShareView');
    expect(match('/s/fABC')).toBe('ShortShareView');
    expect(match('/s/e')).toBe('EditSyncRecipient');
    expect(match('/s/eABC')).toBe('EditSyncRecipient');
    expect(match('/s/u/')).toBe('SyncReview');
  });

  it('readers pass location.hash so #payload links decode', () => {
    expect(read('client/src/pages/EditSyncRecipient.tsx')).toContain("payloadFromPath('e', window.location.pathname, window.location.hash)");
    expect(read('client/src/pages/SyncReview.tsx')).toContain("payloadFromPath('u', window.location.pathname, window.location.hash)");
    expect(read('client/src/lib/shareLink.ts')).toContain("getShortSharePayload('t', path, window.location.hash)");
  });

  it('the Android app shares files with FileProvider + ACTION_SEND and saves to public Downloads', () => {
    const java = read('android-app/app/src/main/java/app/kharcha/splitter/MainActivity.java');
    expect(java).toContain('public boolean shareBase64File(');
    expect(java).toContain('FileProvider.getUriForFile');
    expect(java).toContain('MediaStore.Downloads.IS_PENDING, 0');
    expect(java).toContain('DownloadManager.ACTION_VIEW_DOWNLOADS');
    expect(java).toContain('addCompletedDownload');
    expect(read('android-app/app/src/main/res/xml/filepaths.xml')).toContain('path="shared-files/"');
  });
});
