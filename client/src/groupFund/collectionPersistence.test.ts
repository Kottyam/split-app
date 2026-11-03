import { describe, expect, it } from 'vitest';
import { ONE_TIME_PERIOD, resolveCollectionPeriod } from './calculations';
import { contributionMatchesPeriod, getPeriodCollectedAmount } from './collection';
import { toLocalDateKey } from '@/lib/localDate';
import type { Contribution, GroupFund } from './types';

const fund = { id: 'f', name: 'Trip', isRecurring: false, members: [], contributions: [], expenses: [], createdAt: Date.parse('2026-11-01T10:00:00') } as unknown as GroupFund;
const contribution = (id: string, note: string, amount = 100): Contribution =>
  ({ id, memberId: 'm', amount, note, status: 'Completed', date: Date.now() } as unknown as Contribution);

describe('Group Fund collections stay counted on later days (regression)', () => {
  it('one-time fund: collections made yesterday are still in today\'s total', () => {
    const day1 = resolveCollectionPeriod(fund, new Date('2026-11-02T20:00:00'));
    const day2 = resolveCollectionPeriod(fund, new Date('2026-11-03T09:00:00'));
    expect(day2).toBe(day1);
    expect(day1).toBe(ONE_TIME_PERIOD);
    const saved = [contribution('a', `Cash Collection (${day1})`), contribution('b', `UPI Collection (${day1})`)];
    expect(getPeriodCollectedAmount(saved, 'm', day2)).toBe(200);
  });

  it('one-time fund: legacy collections tagged with an old date label are still counted', () => {
    const legacy = [contribution('a', 'Cash Collection (Nov 2, 2026)'), contribution('b', 'Cash Collection (Nov 3, 2026) — paid late')];
    expect(getPeriodCollectedAmount(legacy, 'm', resolveCollectionPeriod(fund, new Date('2026-11-04T09:00:00')))).toBe(200);
  });

  it('weekly label "Week of Nov 3" does not swallow "Week of Nov 30", and remarks are ignored', () => {
    expect(contributionMatchesPeriod('Cash Collection (Week of Nov 30)', 'Week of Nov 3')).toBe(false);
    expect(contributionMatchesPeriod('Cash Collection (Week of Nov 3)', 'Week of Nov 3')).toBe(true);
    expect(contributionMatchesPeriod('Cash Collection (Week of Nov 10) — owed for Week of Nov 3', 'Week of Nov 3')).toBe(false);
  });

  it('collection date uses the local calendar day, not UTC (IST 00:00–05:30)', () => {
    const justAfterMidnight = new Date(2026, 10, 3, 0, 30);
    expect(toLocalDateKey(justAfterMidnight)).toBe('2026-11-03');
  });
});
