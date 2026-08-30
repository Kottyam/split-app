import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Group Fund member edit contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'client/src/pages/GroupFundDetail.tsx'), 'utf8');

  it('renders an accessible Edit icon action and loads current member fields', () => {
    expect(source).toContain("aria-label={`${t('edit')} ${m.name}`}");
    expect(source).toContain("setEditingMember(m);");
    expect(source).toContain("setMemberName(m.name);");
    expect(source).toContain("setMemberMobile(m.mobileNumber || '')");
    expect(source).toContain("setMemberExpected(fund.isRecurring && fund.amountType === 'Default Amount' ? '' : (m.expectedAmount !== undefined ? String(m.expectedAmount) : ''))");
  });

  it('reuses cycle-aware proration for recurring member Expected Amount', () => {
    expect(source).toContain("calculateMemberAddExpectedAmountForConfiguredPeriod(");
    expect(source).toContain("fund.amountType !== 'Default Amount'");
    expect(source).toContain("setMemberExpected(String(expected));");
    expect(source).toContain('const configuredCollectionReference = collectionStartDate || fund.collectionStartDate || collectionDate');
    expect(source).toContain('const parsedCollectionDate = new Date(`${configuredCollectionReference}T00:00:00`)');
    expect(source).toContain("onChange={e => setMemberStartDate(e.target.value)}");
    expect(source).toContain("t('auditExpectedContribution' as any)}: ₹{expected.toLocaleString('en-IN')}");
    expect(source).toContain("{ ...fund, collectionPeriodMode }");
    expect(source).toContain("fund.amountType === 'Default Amount'");
    expect(source).toContain("collectionDate, collectionStartDate, collectionPeriodMode, fund?.id");
    expect(source).toContain("fund?.defaultContributionAmount");
    expect(source).toContain("fund?.prorationRule");
    expect(source).toContain("fund?.monthlyCycleType");
    expect(source).toContain("t('auditDone' as any)");
    expect(source).toContain("t(isSelectedPeriodClosed ? 'auditUndoCloseCollection' : 'auditCloseCollection' as any)");
  });

  it('keeps the existing delete confirmation action', () => {
    expect(source).toContain('requestDelete({');
    expect(source).toContain("t('auditRemoveMemberConfirmShort' as any");
  });
});
