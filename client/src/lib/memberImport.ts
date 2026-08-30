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
): MemberImportResult<T> {
  const seenNames = new Set(existing.map(member => normaliseName(member.name)));
  const seenPhones = new Set(
    existing.map(member => normalisePhone(member.mobileNumber)).filter(Boolean),
  );
  const added: T[] = [];

  for (const member of incoming) {
    const name = normaliseName(member.name);
    if (!name || seenNames.has(name)) continue;

    const phone = normalisePhone(member.mobileNumber);
    if (phone && seenPhones.has(phone)) continue;

    seenNames.add(name);
    if (phone) seenPhones.add(phone);
    added.push(member);
  }

  return { members: [...existing, ...added], added };
}
