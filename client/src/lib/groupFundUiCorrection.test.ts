import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const createSource = fs.readFileSync(
  path.resolve(process.cwd(), 'client/src/pages/CreateGroupFund.tsx'),
  'utf8',
);
const auditSource = fs.readFileSync(
  path.resolve(process.cwd(), 'client/src/contexts/languageAudit.ts'),
  'utf8',
);
const detailSource = fs.readFileSync(
  path.resolve(process.cwd(), 'client/src/pages/GroupFundDetail.tsx'),
  'utf8',
);
const extrasSource = fs.readFileSync(
  path.resolve(process.cwd(), 'client/src/contexts/languageExtras.ts'),
  'utf8',
);

describe('Group Fund recurring UI correction contract', () => {
  it('uses localized clean frequency and collection-period labels', () => {
    expect(createSource).not.toContain("'Fortnightly', 'Yearly'");
    expect(createSource).toContain("t('auditCustom' as any)");
    expect(createSource).toContain("t('auditCollectionTiming' as any)");
    expect(createSource).toContain("t('auditPreviousPeriod' as any)");
    expect(createSource).toContain("t('auditCollectInAdvance' as any)");
    expect(createSource).toContain("t('auditNoEndDate' as any)");
    expect(createSource).toContain("t('auditEndDate' as any)");
    expect(createSource).toContain("t('auditNumberOfCollections' as any)");
    expect(createSource).not.toContain("t('pbNoEndDate' as any)");
    expect(createSource).not.toContain("t('pbOccurrencesDetails' as any)");
  });

  it('keeps advanced recurrence progressive and controls responsive on narrow screens', () => {
    expect(createSource).toContain('<details className="rounded-xl border');
    expect(createSource).toContain("t('auditAdvancedRecurrence' as any)");
    expect(createSource).toContain('grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[1fr_1.5fr]');
    expect(createSource).toContain('grid min-w-0 grid-cols-3 gap-2 mt-1');
    expect(createSource).toContain('min-w-0 break-words');
  });

  it('keeps the required localized wording available and preserves the close action', () => {
    expect(auditSource).toContain("auditRecurringCollection: 'Recurring Collection'");
    expect(extrasSource).toContain('auditCloseCollection:');
    expect(auditSource).toContain("auditCollectionTiming: 'Collection Timing'");
    expect(auditSource).toContain("auditPreviousPeriod: 'Previous Period'");
    expect(auditSource).toContain("auditCollectInAdvance: 'Collect in Advance'");
    expect(auditSource).toContain("auditNumberOfCollections: 'Number of Collections'");
    expect(auditSource).toContain("auditEndDate: 'End Date'");
    expect(detailSource).toContain("'auditCloseCollection'");
    expect(detailSource).not.toContain('Close Audit Collection');
  });
});

export {};

if (import.meta.vitest) {
  // Keep this source-contract test tree-shake safe in the browser build.
}

void createSource;
void auditSource;
void detailSource;
void extrasSource;
void path;
void fs;
