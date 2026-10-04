import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

describe('global delete confirmation', () => {
  it('defines one reusable modal and mounts its provider globally', () => {
    const component = read('client/src/components/DeleteConfirmationDialog.tsx');
    const context = read('client/src/contexts/DeleteConfirmationContext.tsx');
    const app = read('client/src/App.tsx');

    expect(component).toContain('DeleteConfirmationDialogProps');
    expect(component).toContain('message: string');
    expect(context).toContain('DeleteConfirmationProvider');
    expect(context).toContain('requestDelete');
    expect(app).toContain('DeleteConfirmationProvider');
  });

  it('routes every delete-capable feature through requestDelete', () => {
    const sourceFiles = [
      'client/src/pages/Trips.tsx',
      'client/src/pages/SharedHomes.tsx',
      'client/src/pages/GroupFunds.tsx',
      'client/src/pages/GroupFundDetail.tsx',
      'client/src/pages/SharedHomeDetail.tsx',
      'client/src/components/ExpenseListView.tsx',
      'client/src/components/DeleteMemberDialog.tsx',
    ];

    for (const file of sourceFiles) {
      const source = read(file);
      if (file === 'client/src/components/DeleteMemberDialog.tsx' || file === 'client/src/pages/Trips.tsx') {
        expect(source, file).toContain('DeleteConfirmationDialog');
      } else {
        expect(source, file).toContain('requestDelete');
      }
      expect(source, file).not.toMatch(/window\.confirm\(t\('(delete|auditDelete|sharedHomeRemoveMemberConfirm|sharedHomeDeleteRoomConfirm)/);
    }
  });

  it('keeps non-delete browser prompts distinguishable from delete confirmation', () => {
    const sharedHome = read('client/src/pages/SharedHomeDetail.tsx');
    expect(sharedHome).toContain('sharedHomeStopRuleConfirm');
    expect(sharedHome).not.toContain('window.confirm(t(\'sharedHomeRemoveMemberConfirm\'');
  });
});
