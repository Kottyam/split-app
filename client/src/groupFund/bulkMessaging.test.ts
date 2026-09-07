import { describe, expect, it } from 'vitest';
import {
  getBulkMessageCandidates,
  getBulkMessageDuplicateNumberIds,
  getBulkMessageKind,
  getBulkMessageMissingNumberIds,
  getBulkMessageRecipientIds,
  getBulkMessageRecipients,
  getNextBulkMessageRecipientId,
  isBulkMessageQueueComplete,
  toggleBulkMessageMember,
} from './bulkMessaging';
import type { GroupFundMember } from './types';

const members: GroupFundMember[] = [
  { id: 'one', name: 'Asha', mobileNumber: '9000000001', isActive: true, createdAt: 1 },
  { id: 'two', name: 'Binu', mobileNumber: '', isActive: true, createdAt: 2 },
  { id: 'three', name: 'Chitra', mobileNumber: '9000000003', isActive: true, createdAt: 3 },
  { id: 'four', name: 'Dev', mobileNumber: '9000000004', isActive: true, createdAt: 4 },
];

describe('Group Fund bulk WhatsApp recipients', () => {
  it('classifies each member using recorded status before saved amount', () => {
    expect(getBulkMessageKind({ hasRecordedCollection: true, savedAmount: 500, hasUpiId: true })).toBe('thank-you');
    expect(getBulkMessageKind({ hasRecordedCollection: true, savedAmount: 0, hasUpiId: false })).toBe('thank-you');
    expect(getBulkMessageKind({ hasRecordedCollection: false, savedAmount: 500, hasUpiId: true })).toBe('payment-link');
    expect(getBulkMessageKind({ hasRecordedCollection: false, savedAmount: 0, hasUpiId: true })).toBe('information');
    expect(getBulkMessageKind({ hasRecordedCollection: false, savedAmount: undefined, hasUpiId: true })).toBe('information');
  });

  it('keeps missing-number members visible as candidates but excludes them from the launch queue', () => {
    expect(getBulkMessageCandidates(members, 'all').map(member => member.id)).toEqual(['one', 'two', 'three', 'four']);
    expect(getBulkMessageMissingNumberIds(members, 'all')).toEqual(['two']);
    expect(getBulkMessageRecipientIds(members, 'all')).toEqual(['one', 'three', 'four']);
  });

  it('queues every valid member in original order for Send to All', () => {
    expect(getBulkMessageRecipients(members, 'all').map(member => member.name)).toEqual(['Asha', 'Chitra', 'Dev']);
  });

  it('queues only selected phone-capable members and preserves fund order', () => {
    expect(getBulkMessageRecipientIds(members, 'selection', ['four', 'two', 'one'])).toEqual(['one', 'four']);
  });

  it('flags duplicate normalized numbers without merging member records', () => {
    const duplicateMembers = [
      ...members,
      { id: 'five', name: 'Esha', mobileNumber: '+91 90000 00001', isActive: true, createdAt: 5 },
    ];
    expect(getBulkMessageDuplicateNumberIds(duplicateMembers, 'all')).toEqual(['five']);
    expect(getBulkMessageRecipientIds(duplicateMembers, 'all')).toEqual(['one', 'three', 'four', 'five']);
  });

  it('keeps each queue position available until the final member is opened', () => {
    const queue = getBulkMessageRecipientIds(members, 'all');
    expect(queue.map((_, index) => getNextBulkMessageRecipientId(queue, index))).toEqual(['one', 'three', 'four']);
    expect(isBulkMessageQueueComplete(queue, 0)).toBe(false);
    expect(isBulkMessageQueueComplete(queue, 2)).toBe(false);
    expect(isBulkMessageQueueComplete(queue, 3)).toBe(true);
  });

  it('toggles selection without losing previously selected members', () => {
    expect(toggleBulkMessageMember(['one'], 'three', true)).toEqual(['one', 'three']);
    expect(toggleBulkMessageMember(['one', 'three'], 'one', false)).toEqual(['three']);
  });
});
