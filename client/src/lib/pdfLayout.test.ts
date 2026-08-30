import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.resolve(root, relativePath), 'utf8');

describe('uniform PDF layout and direct save', () => {
  it('defines bounded A4 margins, internal widths, wrapping, and readable table cells', () => {
    const styles = read('client/src/lib/pdfLayout.ts');
    expect(styles).toContain('@page { size: A4 portrait; margin: 12mm; }');
    expect(styles).toContain('.report { width: 100%; max-width: 186mm; margin: 0 auto; }');
    expect(styles).toContain('table { width: 100%; max-width: 100%; table-layout: fixed;');
    expect(styles).toContain('overflow-wrap: anywhere !important;');
    expect(styles).toContain('word-break: break-word !important;');
    expect(styles).toContain('white-space: normal !important;');
  });

  it('uses the shared contract in Trip, Shared Home, and Group Fund reports with branding', () => {
    const trip = read('client/src/pages/TripDetail.tsx');
    const sharedHome = read('client/src/pages/SharedHomeDetail.tsx');
    const groupFund = read('client/src/pages/GroupFundDetail.tsx');
    for (const source of [trip, sharedHome, groupFund]) {
      expect(source).toContain('PDF_LAYOUT_CSS');
      expect(source).toContain('class="report"');
    }
    expect(trip).toContain('KHARCHA_LOGO_LOCKUP');
    expect(sharedHome).toContain('KHARCHA_LOGO_LOCKUP');
    expect(groupFund).toContain('KHARCHA_LOGO_LOCKUP');
  });

  it('saves directly to Downloads instead of delegating Save PDF to Print', () => {
    const mainActivity = read('android-app/app/src/main/java/app/kharcha/splitter/MainActivity.java');
    const saveStart = mainActivity.indexOf('private void savePdfReport');
    const shareStart = mainActivity.indexOf('private void sharePdfReport');
    const saveMethod = mainActivity.slice(saveStart, shareStart);
    expect(saveMethod).toContain('writePdfToDownloads(reportView, title);');
    expect(saveMethod).not.toContain('printPdfReport(reportView, title);');
    expect(mainActivity).toContain('MediaStore.Downloads.RELATIVE_PATH');
    expect(mainActivity).toContain('MediaStore.Downloads.IS_PENDING');
    expect(mainActivity).toContain('PDF saved to Downloads');
  });
});
