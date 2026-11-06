import { describe, expect, it } from 'vitest';
import {
  getLifetimeCollectedAmount,
  getPeriodTotalCollectedAmount,
  isCountedTowardCollected,
} from './collection';
import type { Contribution } from './types';

const period = 'November 2026';

function contrib(
  amount: number,
  status: Contribution['status'],
  note = period,
  id = `${status}-${amount}`,
): Contribution {
  return {
    id,
    fundId: 'fund-1',
    memberId: 'm1',
    amount,
    method: 'Cash',
    date: Date.now(),
    status,
    note,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe('Overview vs Collect collected totals', () => {
  it('counts Partial payments the same way Overview (lifetime) and Collect (period) do', () => {
    // Reproduce the Amal bug: Collect used status !== Cancelled (includes Partial),
    // while Overview used status === 'Paid' only — so Overview undercounted.
    const contributions = [
      contrib(500, 'Paid', period, 'full'),
      contrib(200, 'Partial', period, 'partial'),
      contrib(100, 'Cancelled', period, 'undone'),
    ];

    const periodTotal = getPeriodTotalCollectedAmount(contributions, period, 0, false);
    const lifetimeTotal = getLifetimeCollectedAmount(contributions, 0);

    expect(periodTotal).toBe(700);
    expect(lifetimeTotal).toBe(700);
    expect(lifetimeTotal).toBe(periodTotal);
  });

  it('includes starting balance in both lifetime and the earliest-period Collect total', () => {
    const contributions = [contrib(300, 'Paid')];
    const starting = 50;
    const lifetime = getLifetimeCollectedAmount(contributions, starting);
    const periodWithStart = getPeriodTotalCollectedAmount(contributions, period, starting, true);
    const periodWithoutStart = getPeriodTotalCollectedAmount(contributions, period, starting, false);

    expect(lifetime).toBe(350);
    expect(periodWithStart).toBe(350);
    expect(periodWithoutStart).toBe(300);
    expect(lifetime).toBe(periodWithStart);
  });

  it('sums lifetime across periods while Collect stays period-scoped', () => {
    const contributions = [
      contrib(100, 'Paid', 'October 2026', 'oct'),
      contrib(250, 'Partial', 'November 2026', 'nov'),
    ];
    expect(getPeriodTotalCollectedAmount(contributions, 'November 2026')).toBe(250);
    expect(getPeriodTotalCollectedAmount(contributions, 'October 2026')).toBe(100);
    expect(getLifetimeCollectedAmount(contributions, 0)).toBe(350);
  });

  it('treats Paid and Partial as counted, Cancelled as not', () => {
    expect(isCountedTowardCollected(contrib(1, 'Paid'))).toBe(true);
    expect(isCountedTowardCollected(contrib(1, 'Partial'))).toBe(true);
    expect(isCountedTowardCollected(contrib(1, 'User Confirmed'))).toBe(true);
    expect(isCountedTowardCollected(contrib(1, 'Cancelled'))).toBe(false);
  });

  it('would fail if Overview still filtered status === Paid only', () => {
    const contributions = [contrib(400, 'Partial')];
    const legacyOverviewBug = contributions
      .filter(c => c.status === 'Paid')
      .reduce((s, c) => s + c.amount, 0);
    const fixed = getLifetimeCollectedAmount(contributions, 0);
    expect(legacyOverviewBug).toBe(0);
    expect(fixed).toBe(400);
    expect(fixed).not.toBe(legacyOverviewBug);
  });
});

