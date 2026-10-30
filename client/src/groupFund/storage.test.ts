import { describe, expect, it } from 'vitest';
import { mergeContributionHistory } from './storage';
import type { Contribution } from './types';

function contribution(id: string, memberId: string, updatedAt: number, status: Contribution['status'] = 'Paid'): Contribution {
  return {
    id,
    fundId: 'fund-1',
    memberId,
    amount: 500,
    method: 'Cash',
    date: updatedAt,
    status,
    createdAt: 1,
    updatedAt,
  };
}

describe('Group Fund contribution history safety', () => {
  it('preserves other members payments when an older snapshot is saved', () => {
    const olderSnapshot = [contribution('payment-a', 'member-a', 10)];
    const latestSaved = [
      contribution('payment-a', 'member-a', 10),
      contribution('payment-b', 'member-b', 20),
      contribution('payment-c', 'member-c', 30),
    ];

    expect(mergeContributionHistory(olderSnapshot, latestSaved).map(item => item.id))
      .toEqual(['payment-c', 'payment-b', 'payment-a']);
  });

  it('keeps the newer version of an existing contribution record', () => {
    const stale = [contribution('payment-a', 'member-a', 10, 'Paid')];
    const latest = [contribution('payment-a', 'member-a', 20, 'Cancelled')];

    expect(mergeContributionHistory(stale, latest)[0].status).toBe('Cancelled');
  });

  it('allows an intentional newer contribution update to win', () => {
    const latest = [contribution('payment-a', 'member-a', 10, 'Paid')];
    const updated = [contribution('payment-a', 'member-a', 20, 'Cancelled')];

    expect(mergeContributionHistory(updated, latest)[0].status).toBe('Cancelled');
  });
});
