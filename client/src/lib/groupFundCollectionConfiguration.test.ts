import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Group Fund collection configuration contract', () => {
  const detail = readFileSync(resolve(process.cwd(), 'client/src/pages/GroupFundDetail.tsx'), 'utf8');
  const create = readFileSync(resolve(process.cwd(), 'client/src/pages/CreateGroupFund.tsx'), 'utf8');
  const types = readFileSync(resolve(process.cwd(), 'client/src/groupFund/types.ts'), 'utf8');

  it('persists explicit collection timing on the Fund and exposes it in Create Fund and Members', () => {
    expect(types).toContain("export type CollectionPeriodMode = 'past' | 'future';");
    expect(types).toContain('collectionPeriodMode?: CollectionPeriodMode;');
    expect(types).toContain("collectionTiming?: 'previous' | 'advance';");
    expect(create).toContain('setCollectionPeriodMode');
    expect(create).toContain("collectionPeriodMode: isRecurring && frequency !== 'Daily' ? collectionPeriodMode : undefined");
    expect(detail).toContain("collectionPeriodMode: fund.isRecurring && fund.recurringFrequency !== 'Daily' ? collectionPeriodMode : undefined");
    expect(detail).toContain("collectionTiming: fund.isRecurring ? (collectionPeriodMode === 'past' ? 'previous' : 'advance') : undefined");
    expect(detail).toContain("t('auditPreviousPeriod' as any)");
    expect(detail).toContain("t('auditCollectInAdvance' as any)");
  });

  it('does not render collection-date or Past/Future controls inside Collections', () => {
    const collectionBlock = detail.split("{activeTab === 'collection' && (")[1]?.split("{activeTab === 'members' && (")[0] ?? '';
    expect(collectionBlock).not.toContain('setCollectionDate');
    expect(collectionBlock).not.toContain('setCollectionPeriodMode');
    expect(collectionBlock).toContain('auditTotalCollected');
    expect(collectionBlock).toContain('auditBulkQr');
    expect(collectionBlock).toContain('auditSendBulkMessage');
  });
});

describe('Group Fund cycle resolver contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'client/src/groupFund/calculations.ts'), 'utf8');

  it('resolves the persisted collection mode before period and member calculations', () => {
    expect(source).toContain('export function resolveCollectionPeriod');
    expect(source).toContain("mode === 'past'");
    expect(source).toContain("fund.recurringFrequency === 'Daily'");
  });
});
