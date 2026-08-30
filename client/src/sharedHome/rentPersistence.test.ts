import { describe, expect, it } from 'vitest';
import type { RentConfig, SharedHome } from './types';
import { getSharedHomeById, saveSharedHome } from './storage';
import { persistRentConfiguration } from '@/pages/SharedHomeDetail';
import { buildRentPeriod, upsertRentPeriod } from './rentPersistence';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

const config: RentConfig = {
  totalRent: 24000,
  startDate: Date.UTC(2026, 7, 1),
  frequency: 'monthly',
  splitMethod: 'equal-person',
  stayDayBasis: 'calendar',
  autoGenerate: true,
};

function makeHome(): SharedHome {
  const now = Date.UTC(2026, 7, 1);
  return {
    id: 'home-audit',
    type: 'shared_home',
    name: 'Audit Flat',
    homeType: 'flat',
    startDate: now,
    members: [],
    rooms: [],
    rentPeriods: [],
    expenses: [],
    recurringRules: [],
    settlements: [],
    months: {},
    activity: [],
    createdAt: now,
    updatedAt: now,
  };
}

describe('Shared Home rent persistence', () => {
  it('preserves manual adjustment reason and createdAt after localStorage reload', () => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: new MemoryStorage() });
    const firstHome = makeHome();
    const firstHomeWithRent = persistRentConfiguration(
      firstHome,
      '2026-08',
      config,
      { manager: 24000 },
      [],
      { calculatedAmount: 24000, adjustedAmount: 25000, reason: 'Owner-approved rounding', createdAt: 1111 },
      1000,
    );
    saveSharedHome(firstHomeWithRent);

    const persisted = getSharedHomeById(firstHome.id);
    expect(persisted?.rentPeriods[0]?.adjustment).toEqual({
      calculatedAmount: 24000,
      adjustedAmount: 25000,
      reason: 'Owner-approved rounding',
      createdAt: 1111,
    });

    const revisedPeriod = buildRentPeriod({
      previous: persisted?.rentPeriods[0],
      monthKey: '2026-08',
      config,
      allocations: { manager: 26000 },
      calculation: [],
      adjustment: { calculatedAmount: 24000, adjustedAmount: 26000, reason: 'Updated utility bill', createdAt: 2222 },
      now: 2000,
    });
    saveSharedHome({ ...persisted!, rentPeriods: upsertRentPeriod(persisted!.rentPeriods, revisedPeriod) });

    const reloaded = getSharedHomeById(firstHome.id);
    expect(reloaded?.rentPeriods[0]?.createdAt).toBe(1000);
    expect(reloaded?.rentPeriods[0]?.updatedAt).toBe(2000);
    expect(reloaded?.rentPeriods[0]?.adjustment?.reason).toBe('Updated utility bill');
    expect(reloaded?.rentPeriods[0]?.adjustment?.createdAt).toBe(2222);
  });
});
