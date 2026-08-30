import { describe, expect, it } from 'vitest';
import { createSharedHome } from './factory';

describe('Shared Home creation', () => {
  it('creates an empty home with persisted guided setup and no sample data', () => {
    const home = createSharedHome({
      name: 'Green View',
      homeType: 'flat',
      startDate: Date.UTC(2026, 0, 1),
      address: 'Kochi',
      description: 'Shared home',
      createdMessage: 'Created',
    });

    expect(home.name).toBe('Green View');
    expect(home.setupStep).toBe('members');
    expect(home.members).toEqual([]);
    expect(home.rooms).toEqual([]);
    expect(home.rentPeriods).toEqual([]);
    expect(home.expenses).toEqual([]);
    expect(home.recurringRules).toEqual([]);
    expect(home.settlements).toEqual([]);
    expect(home.months).toEqual({});
  });
});
