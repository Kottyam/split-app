import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

describe('member-add reliability contracts', () => {
  it('keeps Trip Members Add Members connected to the existing dialog flow', () => {
    const source = read('client/src/pages/TripDetail.tsx');
    expect(source).toContain("value=\"members\"");
    expect(source).toContain("setShowAddMember(true)");
    expect(source).toContain('data-testid="trip-add-members"');
    expect(source).not.toContain('inline-flex h-9 w-9');
    expect(source).toContain("t('addMember')");
    expect(source).toContain('<AddMemberDialog');
    expect(source).toContain('TabsTrigger value="reports"');
    expect(source).toContain('TabsContent value="reports"');
    expect(source).toContain("handleGeneratePdfReport('view')");
    expect(source).toContain("handleGeneratePdfReport('print')");
    expect(source).toContain("handleGeneratePdfReport('share')");
    expect(source).not.toContain('PDF Reports');
    expect(source).toContain("t('auditPdfPrint' as any)");
    expect(source).toContain("t('sharedHomeShare' as any)");
    expect(source).toContain('grid-cols-5');
    expect(source).not.toContain('inline-flex h-9 w-9');
    const header = source.slice(source.indexOf('<header'), source.indexOf('</header>'));
    expect(header).not.toContain('handleGeneratePdfReport');
    expect(header).not.toContain('data-testid="trip-add-members"');
    expect(source.slice(source.indexOf('{/* Members Tab */}'), source.indexOf('{/* Reports Tab */}')))
      .toContain('data-testid="trip-add-members"');
  });

  it('keeps visible localized Members and member-first Expense workflow controls', () => {
    const source = read('client/src/pages/TripDetail.tsx');
    const expensesTab = source.slice(source.indexOf('{/* Expenses Tab */}'), source.indexOf('{/* Members Tab */}'));
    const membersTab = source.slice(source.indexOf('{/* Members Tab */}'), source.indexOf('{/* Reports Tab */}'));

    expect(expensesTab).toContain('data-testid="trip-add-expense"');
    expect(expensesTab).toContain('disabled={trip.members.length === 0}');
    expect(expensesTab).toContain('bg-[#18324b]');
    expect(expensesTab).toContain('disabled:bg-[#18324b]');
    expect(expensesTab).toContain("trip.members.length === 0");
    expect(expensesTab).toContain("t('pleaseAddMembers')");
    expect(expensesTab).toContain('data-testid="trip-add-members-from-expense"');
    expect(expensesTab).toContain("t('howToSplitAddExpense')");
    expect(source).toContain("useState('dashboard')");
    expect(source).toContain('previousMemberCount.current === 0 && memberCount > 0');
    expect(source).toContain("setActiveTab('expenses')");
    const tabOrder = [...source.matchAll(/<TabsTrigger value="([^"]+)"/g)].map(match => match[1]);
    expect(tabOrder.slice(0, 5)).toEqual(['dashboard', 'members', 'expenses', 'settle', 'reports']);
    expect(membersTab).toContain('data-testid="trip-add-members"');
    expect(membersTab).toContain('bg-[#18324b]');
    expect(membersTab).not.toContain('data-testid="trip-add-from-contacts"');
    expect(membersTab).not.toContain('data-testid="trip-add-manually"');
    const memberDialog = read('client/src/components/AddMemberDialog.tsx');
    expect(memberDialog).toContain("t('addFromContacts')");
    expect(memberDialog).toContain("t('addMember')");
    expect(memberDialog).toContain("t('addManually')");
    expect(memberDialog).toContain('setShowManualEntry(true)');
    expect(memberDialog.indexOf("t('addFromContacts')")).toBeLessThan(memberDialog.indexOf("t('addManually')"));
    expect(memberDialog).toContain('bg-kharcha-green');
    expect(memberDialog).toContain('onClick={handlePickContact}');
  });

  it('uses the latest persisted Group Fund before importing contacts and refreshes immediately', () => {
    const source = read('client/src/pages/GroupFundDetail.tsx');
    expect(source).toContain('getGroupFundById(params.id) ?? fund');
    expect(source).toContain('appendUniqueMembers(latestFund.members, incomingMembers)');
    expect(source).toContain('refresh(next);');
    expect(source).toContain('if (isImportingContacts) return;');
  });

  it('guards manual Trip and Group Fund submissions against duplicate taps', () => {
    const tripDialog = read('client/src/components/AddMemberDialog.tsx');
    const fundDetail = read('client/src/pages/GroupFundDetail.tsx');
    expect(tripDialog).toContain('if (isSubmitting) return;');
    expect(tripDialog).toContain('disabled={isSubmitting}');
    expect(fundDetail).toContain('if (isSavingMember) return;');
    expect(fundDetail).toContain('disabled={isSavingMember}');
  });
});
