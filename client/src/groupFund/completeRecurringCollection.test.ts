import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const project = resolve(process.cwd());
const createSource = readFileSync(resolve(project, 'client/src/pages/CreateGroupFund.tsx'), 'utf8');
const detailSource = readFileSync(resolve(project, 'client/src/pages/GroupFundDetail.tsx'), 'utf8');
const typesSource = readFileSync(resolve(project, 'client/src/groupFund/types.ts'), 'utf8');
const calculationsSource = readFileSync(resolve(project, 'client/src/groupFund/calculations.ts'), 'utf8');

describe('complete recurring collection integration contract', () => {
  it('shows and persists Collection Start Date only under the recurring master switch', () => {
    expect(createSource).toContain('collectionStartDate: isRecurring ? collectionStartDate : undefined');
    expect(createSource).toContain('{isRecurring ? (');
    expect(createSource).toContain('auditCollectionStartDate');
    expect(typesSource).toContain('collectionStartDate?: string');
  });

  it('keeps the one-time branch on its existing amount workflow', () => {
    expect(calculationsSource).toContain('if (!fund.isRecurring) return true;');
    expect(calculationsSource).toContain('calculateAmountForBounds');
    expect(calculationsSource).toContain('getPeriodBounds');
    expect(createSource).toContain('recurringFrequency: isRecurring ? frequency : undefined');
  });

  it('uses the later fund/member date and lets settings edit the fund date', () => {
    expect(calculationsSource).toContain('return Math.max(getFundCollectionStartTime(fund), getMemberStartTime(fund, member));');
    expect(detailSource).toContain('collectionStartDate: fund.isRecurring ? collectionStartDate || undefined : undefined');
    expect(detailSource).toContain('id="fund-collection-start-date"');
    expect(detailSource).toContain('auditMemberStartDate');
  });

  it('routes display and collection amounts through the period-aware calculator', () => {
    expect(detailSource).toContain('calculateExpectedAmountForPeriod(fund, m, selectedPeriod)');
    expect(detailSource).toContain('calculateExpectedAmountForPeriod(fund, selectedMemberForCollection, selectedPeriod)');
    expect(detailSource).toContain('calculateExpectedAmountForPeriod(fund, m, selectedPeriod)');
  });
});
