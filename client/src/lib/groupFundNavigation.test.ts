import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const detailSource = fs.readFileSync(
  path.resolve(process.cwd(), 'client/src/pages/GroupFundDetail.tsx'),
  'utf8',
);
const listSource = fs.readFileSync(
  path.resolve(process.cwd(), 'client/src/pages/GroupFunds.tsx'),
  'utf8',
);

describe('Group Fund UI navigation contract', () => {
  it('opens Dashboard first and presents the requested navigation order', () => {
    expect(detailSource).toContain("useState<'overview' | 'collection' | 'expenses' | 'members' | 'settle' | 'reports'>('overview')");
    expect(detailSource).not.toContain("activeTab === 'settings'");
    expect(detailSource).toContain('handleSaveSettings');
    const order = [
      "id: 'overview'",
      "id: 'collection'",
      "id: 'members'",
      "id: 'expenses'",
      "id: 'settle'",
      "id: 'reports'",
    ];
    let previousIndex = -1;
    for (const marker of order) {
      const index = detailSource.indexOf(marker);
      expect(index).toBeGreaterThan(previousIndex);
      previousIndex = index;
    }
    expect(detailSource).toContain('grid-cols-2 gap-2');
    expect(detailSource).not.toContain('overflow-x-auto pb-1 text-xs font-black');
  });

  it('keeps reports actions inside Reports and preserves the existing report handler', () => {
    expect(detailSource).toContain("{activeTab === 'reports' && (");
    expect(detailSource).toContain("handleGeneratePdfReport('view')");
    expect(detailSource).toContain("handleGeneratePdfReport('print')");
    expect(detailSource).toContain("handleGeneratePdfReport('save')");
    expect(detailSource).toContain("handleGeneratePdfReport('share')");
    expect(detailSource).not.toContain("onClick={handleGeneratePdfReport}");
  });

  it('keeps fund cards independent and shows a localized fund-type label', () => {
    expect(listSource).toContain('fundTypeLabel');
    expect(listSource).toContain("f.isRecurring ? t('recurringCollection' as any) : t('pbOneTime' as any)");
    expect(listSource).toContain('navigate(`/group-funds/${f.id}`)');
  });
});

export {};

if (import.meta.vitest) {
  // Keep this source-contract test tree-shake safe in the browser build.
}

void detailSource;
void listSource;
void path;
void fs;
