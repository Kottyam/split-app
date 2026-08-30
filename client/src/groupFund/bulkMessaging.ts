import type { GroupFundMember } from './types';

export type BulkMessageMode = 'all' | 'selection';
export type BulkMessageKind = 'thank-you' | 'payment-link' | 'information';

export function getBulkMessageKind(input: {
  hasRecordedCollection: boolean;
  savedAmount?: number;
  hasUpiId: boolean;
}): BulkMessageKind {
  if (input.hasRecordedCollection) return 'thank-you';
  if (input.savedAmount !== undefined && input.savedAmount > 0 && input.hasUpiId) return 'payment-link';
  return 'information';
}

/** Return WhatsApp-capable members in the fund's original order. */
export function getBulkMessageRecipients(
  members: GroupFundMember[],
  mode: BulkMessageMode,
  selectedIds: readonly string[] = [],
): GroupFundMember[] {
  const selected = new Set(selectedIds);
  return members.filter(member => Boolean(member.mobileNumber?.trim()) && (mode === 'all' || selected.has(member.id)));
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
