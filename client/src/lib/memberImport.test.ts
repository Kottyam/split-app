import { describe, expect, it } from 'vitest';
import type { GroupFundMember } from '@/groupFund/types';
import type { SharedHomeMember } from '@/sharedHome/types';
import { appendUniqueMembers } from './memberImport';

function sharedMember(name: string, mobileNumber = ''): SharedHomeMember {
  return {
    id: `shared-${name}`,
    name,
    mobileNumber,
    moveInDate: 0,
    isActive: true,
    roomAssignments: [],
    createdAt: 0,
  };
}

function fundMember(name: string, mobileNumber?: string): GroupFundMember {
  return {
    id: `fund-${name}`,
    name,
    mobileNumber,
    isActive: true,
    createdAt: 0,
  };
}

describe('appendUniqueMembers', () => {
  it('keeps every selected Shared Home contact in one batch', () => {
    const result = appendUniqueMembers(
      [sharedMember('Existing')],
      [sharedMember('Anu', '+91 98765 43210'), sharedMember('Binu', '+91 98765 43211'), sharedMember('Chitra', '+91 98765 43212')],
    );

    expect(result.added.map(member => member.name)).toEqual(['Anu', 'Binu', 'Chitra']);
    expect(result.members.map(member => member.name)).toEqual(['Existing', 'Anu', 'Binu', 'Chitra']);
  });

  it('keeps every selected Group Fund contact in one batch', () => {
    const result = appendUniqueMembers(
      [fundMember('Existing')],
      [fundMember('Dev', '9876543210'), fundMember('Esha', '9876543211')],
    );

    expect(result.added).toHaveLength(2);
    expect(result.members.map(member => member.name)).toEqual(['Existing', 'Dev', 'Esha']);
  });

  it('filters duplicates against existing and earlier selected contacts', () => {
    const result = appendUniqueMembers(
      [sharedMember('Anu', '+91 98765 43210')],
      [sharedMember('anu', '9876543210'), sharedMember('Binu', '9876543211'), sharedMember('Binu', '09876543211')],
    );

    expect(result.added.map(member => member.name)).toEqual(['Binu']);
    expect(result.members).toHaveLength(2);
  });
});
