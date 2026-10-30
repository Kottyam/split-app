export interface MemberImportIdentity {
  name: string;
  mobileNumber?: string;
}

export interface MemberImportResult<T> {
  members: T[];
  added: T[];
}

function normaliseName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

function normalisePhone(phone: string | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits ? digits.slice(-10) : '';
}

/**
 * Append all unique imported members in one deterministic operation.
 * Names are the primary identity; a phone number also prevents duplicates
 * when the same contact is represented with different formatting.
 */
export function appendUniqueMembers<T extends MemberImportIdentity>(
  existing: T[],
  incoming: T[],
  options: { dedupeByPhone?: boolean } = {},
): MemberImportResult<T> {
  const seenNames = new Set(existing.map(member => normaliseName(member.name)));
  const seenPhones = new Set(
    options.dedupeByPhone === false ? [] : existing.map(member => normalisePhone(member.mobileNumber)).filter(Boolean),
  );
  const added: T[] = [];

  for (const member of incoming) {
    const name = normaliseName(member.name);
    if (!name || seenNames.has(name)) continue;

    const phone = normalisePhone(member.mobileNumber);
    if (options.dedupeByPhone !== false && phone && seenPhones.has(phone)) continue;

    seenNames.add(name);
    if (options.dedupeByPhone !== false && phone) seenPhones.add(phone);
    added.push(member);
  }

  return { members: [...existing, ...added], added };
}


export interface ParsedMemberImportRow {
  name: string;
  mobileNumber?: string;
}

/** Parse Excel-exported CSV/TSV text, including quoted names containing commas. */
export function parseMemberImportText(text: string): ParsedMemberImportRow[] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell); cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell);
      if (row.some(value => value.trim())) rows.push(row);
      row = []; cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);

  if (rows.length === 0) return [];
  const header = rows[0].map(value => value.trim().toLocaleLowerCase());
  const nameIndex = header.findIndex(value => ['name', 'member name', 'contact name'].includes(value));
  const phoneIndex = header.findIndex(value => ['mobile', 'mobile number', 'phone', 'phone number', 'telephone', 'tel'].includes(value));
  const hasHeader = nameIndex >= 0;
  const resolvedNameIndex = hasHeader ? nameIndex : 0;
  const resolvedPhoneIndex = phoneIndex >= 0 ? phoneIndex : 1;

  return rows.slice(hasHeader ? 1 : 0).map(values => ({
    name: (values[resolvedNameIndex] ?? '').trim(),
    mobileNumber: (values[resolvedPhoneIndex] ?? '').trim() || undefined,
  })).filter(value => value.name.length > 0);
}
