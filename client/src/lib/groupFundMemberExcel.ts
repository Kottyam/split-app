export interface GroupFundExcelMemberRow {
  name: string;
  mobileNumber: string;
  expectedAmount?: number;
  remarks?: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    crc ^= bytes[index];
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
  return new Blob([...local, ...central, end].map(part => new Uint8Array(part).buffer as ArrayBuffer), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function createGroupFundMemberTemplate(): Blob {
  const files = [
    { name: '[Content_Types].xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>' },
    { name: '_rels/.rels', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Members" sheetId="1" r:id="rId1"/></sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>' },
    { name: 'xl/worksheets/sheet1.xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView showGridLines="1" workbookViewId="0"/></sheetViews><cols><col min="1" max="1" width="28" customWidth="1"/><col min="2" max="2" width="20" customWidth="1"/><col min="3" max="3" width="20" customWidth="1"/><col min="4" max="4" width="30" customWidth="1"/></cols><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Name</t></is></c><c r="B1" t="inlineStr"><is><t>Mobile Number</t></is></c><c r="C1" t="inlineStr"><is><t>Expected Amount</t></is></c><c r="D1" t="inlineStr"><is><t>Remarks</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>Rahul</t></is></c><c r="B2" t="inlineStr"><is><t>9876543210</t></is></c><c r="C2"><v>1000</v></c></row></sheetData></worksheet>' },
  ];
  return zipStore(files);
}

async function unzipXlsx(file: Blob): Promise<Map<string, Uint8Array>> {
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

const NAME_HEADERS = ['name', 'member name', 'member', 'full name', 'പേര്', 'അംഗത്തിന്റെ പേര്'];
const PHONE_HEADERS = ['mobile number', 'mobile', 'phone', 'phone number', 'mobile no', 'contact', 'contact number', 'മൊബൈൽ', 'മൊബൈൽ നമ്പർ', 'ഫോൺ', 'ഫോൺ നമ്പർ'];
const REMARKS_HEADERS = ['remarks', 'remark', 'notes', 'note', 'കുറിപ്പ്', 'അഭിപ്രായം'];
const AMOUNT_HEADERS = ['expected amount', 'expected contribution', 'amount', 'contribution', 'തുക', 'പ്രതീക്ഷിക്കുന്ന തുക'];

function normaliseHeader(value: string): string {
  return value.replace(/[*().:]/g, ' ').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}

/** True when the file looks like an .xlsx workbook (ZIP signature) regardless of name/MIME. */
export async function isXlsxFile(file: Blob & { name?: string }): Promise<boolean> {
  if (file.name && /\.xlsx$/i.test(file.name)) return true;
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  return head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04;
}

function resolveFirstSheetPath(files: Map<string, Uint8Array>, parser: DOMParser): string | undefined {
  const workbook = files.get('xl/workbook.xml');
  const rels = files.get('xl/_rels/workbook.xml.rels');
  if (workbook && rels) {
    const wb = parser.parseFromString(decoder.decode(workbook), 'application/xml');
    const firstSheet = wb.getElementsByTagName('sheet')[0];
    const relId = firstSheet?.getAttribute('r:id') ?? firstSheet?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
    if (relId) {
      const relDoc = parser.parseFromString(decoder.decode(rels), 'application/xml');
      const rel = Array.from(relDoc.getElementsByTagName('Relationship')).find(item => item.getAttribute('Id') === relId);
      const target = rel?.getAttribute('Target');
      if (target) {
        const path = target.startsWith('/') ? target.slice(1) : `xl/${target}`;
        if (files.has(path)) return path;
      }
    }
  }
  if (files.has('xl/worksheets/sheet1.xml')) return 'xl/worksheets/sheet1.xml';
  return Array.from(files.keys()).filter(name => /^xl\/worksheets\/[^/]+\.xml$/.test(name)).sort()[0];
}

export interface GroupFundExcelSkippedRow {
  row: number;
  reason: 'missingName' | 'invalidMobile' | 'invalidAmount';
}

export interface GroupFundExcelParseResult {
  rows: GroupFundExcelMemberRow[];
  skipped: GroupFundExcelSkippedRow[];
}

export async function parseGroupFundMemberXlsxDetailed(file: Blob): Promise<GroupFundExcelParseResult> {
  const files = await unzipXlsx(file);
  const parser = new DOMParser();
  const sheetPath = resolveFirstSheetPath(files, parser);
  const sheetBytes = sheetPath ? files.get(sheetPath) : undefined;
  if (!sheetBytes) throw new Error('Excel sheet not found');
  const sheet = parser.parseFromString(decoder.decode(sheetBytes), 'application/xml');
  if (sheet.getElementsByTagName('parsererror').length) throw new Error('Invalid Excel sheet');
  const sharedBytes = files.get('xl/sharedStrings.xml');
  const shared = sharedBytes ? Array.from(parser.parseFromString(decoder.decode(sharedBytes), 'application/xml').getElementsByTagName('si')).map(si => Array.from(si.getElementsByTagName('t')).map(t => t.textContent ?? '').join('')) : [];
  const rows = Array.from(sheet.getElementsByTagName('row'));
  if (!rows.length) return { rows: [], skipped: [] };
  const cellsOf = (row: Element): Map<string, string> => {
    const map = new Map<string, string>();
    Array.from(row.getElementsByTagName('c')).forEach((cell, index) => {
      const column = cell.getAttribute('r')?.replace(/\d+/g, '') || String.fromCharCode(65 + index);
      const type = cell.getAttribute('t');
      let value: string;
      if (type === 'inlineStr') value = Array.from(cell.getElementsByTagName('t')).map(t => t.textContent ?? '').join('');
      else {
        const raw = xmlText(cell.getElementsByTagName('v')[0] ?? null);
        value = type === 's' ? shared[Number(raw)] ?? '' : raw;
      }
      map.set(column, value);
    });
    return map;
  };
  // Find the header row within the first few rows and search every column.
  let headerIndex = -1;
  let nameCol: string | undefined;
  let phoneCol: string | undefined;
  let amountCol: string | undefined;
  let remarksCol: string | undefined;
  for (let i = 0; i < Math.min(rows.length, 5) && headerIndex < 0; i += 1) {
    const cells = cellsOf(rows[i]);
    for (const [col, value] of Array.from(cells.entries())) {
      const header = normaliseHeader(value);
      if (!nameCol && NAME_HEADERS.includes(header)) nameCol = col;
      else if (!phoneCol && PHONE_HEADERS.includes(header)) phoneCol = col;
      else if (!amountCol && AMOUNT_HEADERS.includes(header)) amountCol = col;
      else if (!remarksCol && REMARKS_HEADERS.includes(header)) remarksCol = col;
    }
    if (nameCol) headerIndex = i;
    else { phoneCol = undefined; amountCol = undefined; remarksCol = undefined; }
  }
  if (!nameCol) throw new Error('Excel must have a Name column');
  const parsed: GroupFundExcelMemberRow[] = [];
  const skipped: GroupFundExcelSkippedRow[] = [];
  rows.slice(headerIndex + 1).forEach((row, offset) => {
    const rowNumber = Number(row.getAttribute('r')) || headerIndex + offset + 2;
    const cells = cellsOf(row);
    const name = (cells.get(nameCol!) ?? '').trim();
    const rawPhone = phoneCol ? (cells.get(phoneCol) ?? '').trim() : '';
    const rawAmount = amountCol ? (cells.get(amountCol) ?? '').trim() : '';
    if (!name && !rawPhone && !rawAmount) return;
    if (!name) { skipped.push({ row: rowNumber, reason: 'missingName' }); return; }
    const digits = rawPhone.replace(/\D/g, '');
    const mobileNumber = digits.slice(-10);
    if (digits && digits.length < 10) { skipped.push({ row: rowNumber, reason: 'invalidMobile' }); return; }
    const expectedAmount = rawAmount ? Number(rawAmount.replace(/[,₹\s]/g, '')) : undefined;
    if (expectedAmount !== undefined && (!Number.isFinite(expectedAmount) || expectedAmount < 0)) { skipped.push({ row: rowNumber, reason: 'invalidAmount' }); return; }
    const remarks = remarksCol ? (cells.get(remarksCol) ?? '').trim() : '';
    parsed.push(remarks ? { name, mobileNumber, expectedAmount, remarks } : { name, mobileNumber, expectedAmount });
  });
  return { rows: parsed, skipped };
}

export async function parseGroupFundMemberXlsx(file: Blob): Promise<GroupFundExcelMemberRow[]> {
  return (await parseGroupFundMemberXlsxDetailed(file)).rows;
}
