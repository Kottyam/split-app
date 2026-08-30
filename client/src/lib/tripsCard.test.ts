import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'client/src/pages/Trips.tsx'), 'utf8');

describe('main Trips card cleanup', () => {
  it('removes the requested subtitle and Open Trip/View Only content', () => {
    expect(source).not.toContain('trip.description || t(\'startPlanning\')');
    expect(source).not.toContain('t(\'tripOpen\')');
    expect(source).not.toContain('t(\'viewOnly\')');
  });

  it('keeps the existing trip card content and uses a compact centered width', () => {
    expect(source).toContain('max-w-2xl');
    expect(source).toContain('t(\'tripMembers\')');
    expect(source).toContain('t(\'tripExpenseTotal\')');
    expect(source).toContain('t(\'budgetRemaining\')');
    expect(source).toContain('setTripPendingDelete');
    expect(source).toContain('<CalendarDays size={14} />');
    expect(source).toContain('<Users size={14} />');
    expect(source).toContain('<Wallet size={14} />');
  });
});
