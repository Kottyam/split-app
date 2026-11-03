// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createGroupFundMemberTemplate, isXlsxFile, parseGroupFundMemberXlsxDetailed } from './groupFundMemberExcel';

// Minimal stored (uncompressed) zip writer for building test workbooks.
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const b of bytes) { crc ^= b; for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
function zip(files: Record<string, string>): Blob {
  const enc = new TextEncoder(); const parts: Uint8Array[] = []; const central: Uint8Array[] = []; let offset = 0;
  for (const [n, c] of Object.entries(files)) {
    const name = enc.encode(n); const data = enc.encode(c); const crc = crc32(data);
    const h = new Uint8Array(30 + name.length); const v = new DataView(h.buffer);
    v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint32(14, crc, true); v.setUint32(18, data.length, true); v.setUint32(22, data.length, true); v.setUint16(26, name.length, true); h.set(name, 30);
    const ch = new Uint8Array(46 + name.length); const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true); cv.setUint16(28, name.length, true); cv.setUint32(42, offset, true); ch.set(name, 46);
    parts.push(h, data); central.push(ch); offset += h.length + data.length;
  }
  const size = central.reduce((s, c) => s + c.length, 0);
  const end = new Uint8Array(22); const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, central.length, true); ev.setUint16(10, central.length, true); ev.setUint32(12, size, true); ev.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end]);
}
const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
function workbook(sheetXml: string, shared?: string[]): Blob {
  const files: Record<string, string> = {
    'xl/workbook.xml': `<workbook xmlns="${NS}" xmlns:r="${R}"><sheets><sheet name="People" sheetId="1" r:id="rId7"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId7" Type="${R}/worksheet" Target="worksheets/people.xml"/></Relationships>`,
    'xl/worksheets/people.xml': `<worksheet xmlns="${NS}"><sheetData>${sheetXml}</sheetData></worksheet>`,
  };
  if (shared) files['xl/sharedStrings.xml'] = `<sst xmlns="${NS}">${shared.map(s => `<si><t>${s}</t></si>`).join('')}</sst>`;
  return zip(files);
}

describe('Group Fund member Excel import', () => {
  it('round-trips the downloaded template', async () => {
    const template = createGroupFundMemberTemplate();
    expect(await isXlsxFile(template)).toBe(true);
    const result = await parseGroupFundMemberXlsxDetailed(template);
    expect(result.rows).toEqual([{ name: 'Rahul', mobileNumber: '9876543210', expectedAmount: 1000 }]);
  });

  it('accepts a Name-only sheet with shared strings, a non-default sheet path and any column order', async () => {
    const file = workbook(
      '<row r="1"><c r="B1" t="s"><v>0</v></c><c r="D1" t="s"><v>1</v></c></row>' +
      '<row r="2"><c r="B2" t="s"><v>2</v></c><c r="D2"><v>919876543210</v></c></row>' +
      '<row r="3"><c r="B3" t="s"><v>3</v></c></row>',
      ['Member Name', 'Phone', 'Anu', 'Biju'],
    );
    const result = await parseGroupFundMemberXlsxDetailed(file);
    expect(result.rows).toEqual([
      { name: 'Anu', mobileNumber: '9876543210', expectedAmount: undefined },
      { name: 'Biju', mobileNumber: '', expectedAmount: undefined },
    ]);
  });

  it('understands Malayalam headers and reports skipped rows', async () => {
    const file = workbook(
      '<row r="1"><c r="A1" t="inlineStr"><is><t>പേര്</t></is></c><c r="B1" t="inlineStr"><is><t>മൊബൈൽ നമ്പർ</t></is></c><c r="C1" t="inlineStr"><is><t>തുക</t></is></c></row>' +
      '<row r="2"><c r="A2" t="inlineStr"><is><t>Chinnu</t></is></c><c r="B2" t="inlineStr"><is><t>+91 98765 43211</t></is></c><c r="C2"><v>500</v></c></row>' +
      '<row r="3"><c r="B3" t="inlineStr"><is><t>9876543212</t></is></c></row>' +
      '<row r="4"><c r="A4" t="inlineStr"><is><t>Deepa</t></is></c><c r="B4" t="inlineStr"><is><t>123</t></is></c></row>',
    );
    const result = await parseGroupFundMemberXlsxDetailed(file);
    expect(result.rows).toEqual([{ name: 'Chinnu', mobileNumber: '9876543211', expectedAmount: 500 }]);
    expect(result.skipped).toEqual([{ row: 3, reason: 'missingName' }, { row: 4, reason: 'invalidMobile' }]);
  });

  it('rejects a sheet without a Name column', async () => {
    const file = workbook('<row r="1"><c r="A1" t="inlineStr"><is><t>Phone</t></is></c></row>');
    await expect(parseGroupFundMemberXlsxDetailed(file)).rejects.toThrow(/Name column/);
  });

  it('detects xlsx by content even without an .xlsx name or MIME type', async () => {
    const blob = createGroupFundMemberTemplate();
    const file = new File([await blob.arrayBuffer()], 'members', { type: '' });
    expect(await isXlsxFile(file)).toBe(true);
    expect(await isXlsxFile(new File(['Name,Mobile'], 'members.csv'))).toBe(false);
  });

  it('uses real regexes (not escaped backslashes) in the Group Fund page import handlers', () => {
    const source = readFileSync(resolve(__dirname, '../pages/GroupFundDetail.tsx'), 'utf8');
    expect(source).not.toContain('/\\\\D/g');
    expect(source).not.toContain('/\\\\.xlsx');
    expect(source).toContain('accept=".xlsx,.csv,.txt"');
  });
});

describe('Group Fund Android fixes', () => {
  const root = resolve(__dirname, '../../..');
  const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

  it('reads an optional Remarks column', async () => {
    const file = workbook('<row r="1"><c r="A1" t="inlineStr"><is><t>Name</t></is></c><c r="B1" t="inlineStr"><is><t>Remarks</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>Anu</t></is></c><c r="B2" t="inlineStr"><is><t>Joined late</t></is></c></row>');
    expect((await parseGroupFundMemberXlsxDetailed(file)).rows[0]).toMatchObject({ name: 'Anu', remarks: 'Joined late' });
  });

  it('saves the template through the native KharchaFiles bridge on Android', async () => {
    const { downloadBlobFile } = await import('./fileDownload');
    const calls: string[][] = [];
    (window as any).KharchaFiles = { saveBase64File: (n: string, m: string, b: string) => { calls.push([n, m, b]); return true; } };
    await expect(downloadBlobFile(createGroupFundMemberTemplate(), 'template.xlsx')).resolves.toBe(true);
    expect(calls[0][0]).toBe('template.xlsx');
    expect(atob(calls[0][2]).startsWith('PK')).toBe(true);
    delete (window as any).KharchaFiles;
    expect(read('android-app/app/src/main/java/app/kharcha/splitter/MainActivity.java')).toContain('new FileBridge(), "KharchaFiles"');
  });

  it('hides the Android 12+ system splash so only the branded splash shows', () => {
    const theme = read('android-app/app/src/main/res/values-v31/splash_theme.xml');
    expect(theme).toContain('windowSplashScreenAnimatedIcon">@drawable/splash_transparent_icon');
  });

  it('prefills Collect with the fund default amount and shows visible Excel buttons', () => {
    const page = read('client/src/pages/GroupFundDetail.tsx');
    expect(page).toContain('[defaultExpected, m.expectedAmount, fund.defaultContributionAmount]');
    expect(page.match(/t\('gfDownloadTemplate' as any\)/g)?.length).toBeGreaterThanOrEqual(2);
    expect(page).toContain('<td class="remarks">');
  });
});
