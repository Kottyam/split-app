import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('uniform section header coverage', () => {
  it('defines the shared small-logo and page-title header structure', () => {
    const source = read('client/src/components/AppSectionHeader.tsx');
    expect(source).toContain("<BrandLogo variant=\"landing\"");
    expect(source).toContain('sticky top-0 z-30');
    expect(source).toContain('flex flex-col gap-2');
    expect(source).toContain('text-lg font-black text-kharcha-navy');
  });

  it('uses the shared header across primary and routed sub-sections', () => {
    const pages = [
      'Trips.tsx',
      'SharedHomes.tsx',
      'GroupFunds.tsx',
      'CreateGroupFund.tsx',
      'TripDetail.tsx',
      'SharedHomeDetail.tsx',
      'GroupFundDetail.tsx',
      'PersonalBudget.tsx',
      'Search.tsx',
      'Notifications.tsx',
      'More.tsx',
      'EditSyncRecipient.tsx',
      'SyncReview.tsx',
      'SyncUpdates.tsx',
      'SharedHomeSharedView.tsx',
      'SharedHomePaymentRequest.tsx',
      'NotFound.tsx',
    ];
    for (const page of pages) {
      const source = page === 'Home.tsx'
        ? read(`client/src/pages/${page}`)
        : page === 'NotFound.tsx'
          ? read(`client/src/pages/${page}`)
          : read(`client/src/pages/${page}`);
      expect(source).toContain('AppSectionHeader');
    }
    expect(read('client/src/components/SharedTripViewOnlyHeader.tsx')).toContain('AppSectionHeader');
  });

  it('keeps the Landing page actions in its compact icon-action pattern', () => {
    const home = read('client/src/pages/Home.tsx');
    expect(home).not.toContain('AppSectionHeader');
    expect(home).toContain('function HeaderAction');
    expect(home).toContain("onClick={() => navigate('/search')}");
    expect(home).toContain("onClick={() => navigate('/notifications')}");
    expect(home).toContain("onClick={() => setShowSettings(true)}");
    expect(home).toContain('notificationCount > 0 ? String(notificationCount) : undefined');
  });

  it('keeps existing navigation and action handlers in place', () => {
    expect(read('client/src/pages/Trips.tsx')).toContain("onClick={() => setShowCreate(true)}");
    expect(read('client/src/pages/SharedHomes.tsx')).toContain("onClick={() => setShowCreate(true)}");
    expect(read('client/src/pages/GroupFunds.tsx')).toContain("navigate('/group-funds/new')");
    expect(read('client/src/pages/PersonalBudget.tsx')).toContain('selectTab(tab.id)');
    expect(read('client/src/pages/TripDetail.tsx')).toContain("setActiveTab('dashboard')");
    expect(read('client/src/pages/GroupFundDetail.tsx')).toContain('setShowEditSync(true)');
  });
});
