export interface GroupFundExcelMemberRow {
  name: string;
  mobileNumber: string;
  expectedAmount?: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(view: DataView, offset: number, value: number) { view.setUint16(offset, value, true); }
function u32(view: DataView, offset: number, value: number) { view.setUint32(offset, value >>> 0, true); }

function zipStore(files: { name: string; content: string }[]): Blob {
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const header = new Uint8Array(30 + name.length);
    const hv = new DataView(header.buffer);
    u32(hv, 0, 0x04034b50); u16(hv, 4, 20); u16(hv, 6, 0x0800);
    u16(hv, 8, 0); u32(hv, 14, crc); u32(hv, 18, data.length); u32(hv, 22, data.length);
    u16(hv, 26, name.length); header.set(name, 30);
    local.push(header, data);

    const directory = new Uint8Array(46 + name.length);
    const dv = new DataView(directory.buffer);
    u32(dv, 0, 0x02014b50); u16(dv, 4, 20); u16(dv, 6, 20); u16(dv, 8, 0x0800);
    u16(dv, 10, 0); u32(dv, 16, crc); u32(dv, 20, data.length); u32(dv, 24, data.length);
    u16(dv, 28, name.length); u32(dv, 42, offset); directory.set(name, 46);
    central.push(directory);
    offset += header.length + data.length;
  }
  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  u32(ev, 0, 0x06054b50); u16(ev, 8, files.length); u16(ev, 10, files.length);
  u32(ev, 12, centralSize); u32(ev, 16, offset);
  return new Blob([...local, ...central, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function createGroupFundMemberTemplate(): Blob {
  const files = [
    { name: '[Content_Types].xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>' },
    { name: '_rels/.rels', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Members" sheetId="1" r:id="rId1"/></sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>' },
    { name: 'xl/worksheets/sheet1.xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView showGridLines="1" workbookViewId="0"/></sheetViews><cols><col min="1" max="1" width="28" customWidth="1"/><col min="2" max="2" width="20" customWidth="1"/><col min="3" max="3" width="20" customWidth="1"/></cols><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Name</t></is></c><c r="B1" t="inlineStr"><is><t>Mobile Number</t></is></c><c r="C1" t="inlineStr"><is><t>Expected Amount</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>Rahul</t></is></c><c r="B2" t="inlineStr"><is><t>9876543210</t></is></c><c r="C2"><v>1000</v></c></row></sheetData></worksheet>' },
  ];
  return zipStore(files);
}

async function unzipXlsx(file: File): Promise<Map<string, Uint8Array>> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Invalid Excel workbook');
  const count = view.getUint16(eocd + 10, true);
  let cursor = view.getUint32(eocd + 16, true);
  const files = new Map<string, Uint8Array>();
  for (let i = 0; i < count; i += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error('Invalid Excel directory');
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);
    let data: Uint8Array;
    if (method === 0) data = compressed;
    else if (method === 8 && typeof DecompressionStream !== 'undefined') {
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw' as CompressionFormat));
      data = new Uint8Array(await new Response(stream).arrayBuffer());
    } else throw new Error('Unsupported Excel compression');
    files.set(name, data);
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

function xmlText(element: Element | null): string {
  return element?.textContent?.trim() ?? '';
}

export async function parseGroupFundMemberXlsx(file: File): Promise<GroupFundExcelMemberRow[]> {
  const files = await unzipXlsx(file);
  const sheetBytes = files.get('xl/worksheets/sheet1.xml');
  if (!sheetBytes) throw new Error('Excel sheet not found');
  const parser = new DOMParser();
  const sheet = parser.parseFromString(decoder.decode(sheetBytes), 'application/xml');
  if (sheet.querySelector('parsererror')) throw new Error('Invalid Excel sheet');
  const sharedBytes = files.get('xl/sharedStrings.xml');
  const shared = sharedBytes ? Array.from(parser.parseFromString(decoder.decode(sharedBytes), 'application/xml').querySelectorAll('si')).map(si => Array.from(si.querySelectorAll('t')).map(t => t.textContent ?? '').join('')) : [];
  const rows = Array.from(sheet.querySelectorAll('sheetData row'));
  if (!rows.length) return [];
  const cellValue = (row: Element, column: string): string => {
    const cell = Array.from(row.querySelectorAll('c')).find(item => item.getAttribute('r')?.replace(/\d+/g, '') === column);
    if (!cell) return '';
    const value = xmlText(cell.querySelector('v'));
    if (cell.getAttribute('t') === 's') return shared[Number(value)] ?? '';
    if (cell.getAttribute('t') === 'inlineStr') return Array.from(cell.querySelectorAll('t')).map(t => t.textContent ?? '').join('');
    return value;
  };
  const header = rows[0];
  const nameCol = ['A', 'B', 'C'].find(col => ['name', 'member name'].includes(cellValue(header, col).trim().toLowerCase()));
  const phoneCol = ['A', 'B', 'C'].find(col => ['mobile number', 'mobile', 'phone', 'phone number'].includes(cellValue(header, col).trim().toLowerCase()));
  const amountCol = ['A', 'B', 'C'].find(col => ['expected amount', 'expected contribution', 'amount'].includes(cellValue(header, col).trim().toLowerCase()));
  if (!nameCol || !phoneCol || !amountCol) throw new Error('Excel columns must be Name, Mobile Number, Expected Amount');
  return rows.slice(1).map(row => {
    const name = cellValue(row, nameCol).trim();
    const mobileNumber = cellValue(row, phoneCol).replace(/\D/g, '').trim();
    const rawAmount = cellValue(row, amountCol).trim();
    const expectedAmount = rawAmount ? Number(rawAmount.replace(/,/g, '')) : undefined;
    if (!name && !mobileNumber && !rawAmount) return null;
    if (!name || mobileNumber.length !== 10 || (expectedAmount !== undefined && (!Number.isFinite(expectedAmount) || expectedAmount < 0))) return null;
    return { name, mobileNumber, expectedAmount };
  }).filter((row): row is GroupFundExcelMemberRow => row !== null);
}
