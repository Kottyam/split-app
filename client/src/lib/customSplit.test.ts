import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getCustomSplitStatus } from './customSplit';

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), 'utf8');

describe('Trip custom split validation', () => {
  it('reports the difference when the split does not match the total', () => {
    expect(getCustomSplitStatus(1000, ['300', '400'])).toMatchObject({ splitTotal: 700, difference: 300, matches: false });
    expect(getCustomSplitStatus(1000, ['600', '500'])).toMatchObject({ difference: -100, matches: false });
    expect(getCustomSplitStatus(100, ['33.33', '33.33', '33.34'])).toMatchObject({ matches: true });
    expect(getCustomSplitStatus(100, ['', 'abc', 100])).toMatchObject({ matches: true });
  });

  it('shows an inline error, a toast and a live indicator in add and edit dialogs', () => {
    for (const file of ['client/src/components/AddExpenseDialog.tsx', 'client/src/components/EditExpenseDialog.tsx']) {
      const source = read(file);
      expect(source).toContain("t('tripSplitMismatch' as any");
      expect(source).toContain('setSplitError(message);');
      expect(source).toContain('toast.error(message);');
      expect(source).toContain('data-testid="custom-split-status"');
    }
  });

  it('keeps Add expense above the trip expense list', () => {
    const trip = read('client/src/pages/TripDetail.tsx');
    expect(trip.indexOf('data-testid="trip-add-expense"')).toBeLessThan(trip.indexOf('<ExpenseListView trip={trip}'));
    expect(trip).toContain('className="sticky top-2 z-20"');
  });
});
