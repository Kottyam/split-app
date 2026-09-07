import type { GroupFundMember } from './types';
import { normalizeWhatsAppNumber } from './payment';

export type BulkMessageMode = 'all' | 'selection';
export type BulkMessageKind = 'all' | 'thank-you' | 'payment-link' | 'information';

export function getBulkMessageKind(input: {
  hasRecordedCollection: boolean;
  savedAmount?: number;
  hasUpiId: boolean;
}): Exclude<BulkMessageKind, 'all'> {
  if (input.hasRecordedCollection) return 'thank-you';
  if (input.savedAmount !== undefined && input.savedAmount > 0 && input.hasUpiId) return 'payment-link';
  return 'information';
}

/** All members eligible to appear in the bulk composer, including missing-number members. */
export function getBulkMessageCandidates(
  members: GroupFundMember[],
  mode: BulkMessageMode,
  selectedIds: readonly string[] = [],
): GroupFundMember[] {
  const selected = new Set(selectedIds);
  return members.filter(member => mode === 'all' || selected.has(member.id));
}

/** Return WhatsApp-capable members in the fund's original order. */
export function getBulkMessageRecipients(
  members: GroupFundMember[],
  mode: BulkMessageMode,
  selectedIds: readonly string[] = [],
): GroupFundMember[] {
  return getBulkMessageCandidates(members, mode, selectedIds).filter(member => Boolean(normalizeWhatsAppNumber(member.mobileNumber)));
}

export function getBulkMessageMissingNumberIds(
  members: GroupFundMember[],
  mode: BulkMessageMode,
  selectedIds: readonly string[] = [],
): string[] {
  return getBulkMessageCandidates(members, mode, selectedIds)
    .filter(member => !normalizeWhatsAppNumber(member.mobileNumber))
    .map(member => member.id);
}

export function getBulkMessageDuplicateNumberIds(
  members: GroupFundMember[],
  mode: BulkMessageMode,
  selectedIds: readonly string[] = [],
): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const member of getBulkMessageRecipients(members, mode, selectedIds)) {
    const normalized = normalizeWhatsAppNumber(member.mobileNumber)!;
    if (seen.has(normalized)) duplicates.add(member.id);
    else seen.add(normalized);
  }
  return Array.from(duplicates);
}

export function getBulkMessageRecipientIds(
  members: GroupFundMember[],
  mode: BulkMessageMode,
  selectedIds: readonly string[] = [],
): string[] {
  return getBulkMessageRecipients(members, mode, selectedIds).map(member => member.id);
}

export function getNextBulkMessageRecipientId(
  queue: readonly string[],
  currentIndex: number,
): string | undefined {
  return queue[currentIndex];
}

export function isBulkMessageQueueComplete(
  queue: readonly string[],
  currentIndex: number,
): boolean {
  return queue.length === 0 || currentIndex >= queue.length;
}

export function toggleBulkMessageMember(
  selectedIds: readonly string[],
  memberId: string,
  checked: boolean,
): string[] {
  const next = new Set(selectedIds);
  if (checked) next.add(memberId);
  else next.delete(memberId);
  return Array.from(next);
}
