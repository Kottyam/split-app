import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Trip Add Expense validation contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'client/src/components/AddExpenseDialog.tsx'), 'utf8');

  it('validates equal-all using the current trip members', () => {
    expect(source).toContain("const activeMembers = splitType === 'equal-all' ? new Set(trip.members.map(member => member.id)) : selectedMembers;");
    expect(source).toContain('activeMembers.size === 0');
  });

  it('uses themed feedback instead of native alerts', () => {
    expect(source).toContain("toast.error(t('fillRequired'))");
    expect(source).not.toContain("alert(t('fillRequired'))");
  });
});

export {};

// Keep this source contract test focused on the user-reported regression: the
// existing split algorithm and persistence behavior are intentionally unchanged.
