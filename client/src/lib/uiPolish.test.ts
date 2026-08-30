import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

describe('Kharcha UI polish contracts', () => {
  it('keeps the existing brand palette and accessible global rendering polish', () => {
    const css = read('client/src/index.css');
    expect(css).toContain('--color-peach-50');
    expect(css).toContain('background-color: #ffffff');
    expect(css).toContain('-webkit-font-smoothing: antialiased');
    expect(css).toContain('.safe-area-inset-bottom');
  });

  it('uses lighter responsive branded surfaces on the main list pages', () => {
    for (const file of ['Home.tsx', 'Trips.tsx', 'SharedHomes.tsx', 'GroupFunds.tsx']) {
      const source = read(`client/src/pages/${file}`);
      expect(source).toContain('rounded-3xl');
      expect(source).toContain('shadow-sm');
    }
  });

  it('keeps navigation presentation safe-area aware and route behavior unchanged', () => {
    const bottomNav = read('client/src/components/BottomNav.tsx');
    expect(bottomNav).toContain('safe-area-inset-bottom');
    expect(bottomNav).toContain('navigate(item.path)');
    expect(bottomNav).toContain("'/shared-homes'");
    expect(bottomNav).toContain("'/personal-budget'");
    expect(bottomNav).toContain("t('more' as any)");
    expect(bottomNav).toContain('text-kharcha-navy');
  });

  it('keeps Personal Budget presentation changes scoped to its existing controls', () => {
    const personalBudget = read('client/src/pages/PersonalBudget.tsx');
    expect(personalBudget).toContain('border-[#d1e5d7]');
    expect(personalBudget).toContain('AppSectionHeader');
    expect(personalBudget).toContain('const selectTab = (tab: TabId) => setActiveTab(tab);');
    expect(personalBudget).toContain('changeMonth(-1)');
    expect(personalBudget).toContain('changeMonth(1)');
    expect(personalBudget).toContain('grid-cols-2');
    expect(personalBudget).toContain('sm:overflow-x-auto');
  });

  it('keeps the Home header composition and existing category routes intact', () => {
    const home = read('client/src/pages/Home.tsx');
    expect(home).toContain("<Search size={18} />");
    expect(home).toContain("<Bell size={18} />");
    expect(home).toContain("<Settings size={18} />");
    expect(home).toContain('notificationCount > 0 ? String(notificationCount)');
    expect(home).toContain("t('whatManage')");
    expect(home).toContain("t('chooseCategory' as any)");
    expect(home).toContain('appCategories.trips.path');
    expect(home).toContain('appCategories.sharedHomes.path');
    expect(home).toContain('appCategories.groupFunds.path');
    expect(home).toContain("appCategories.personalBudget.path");
    expect(home).not.toContain('pointer-events-none fixed');
  });

  it('applies the unified app shell and internal page-header contract across modules', () => {
    const app = read('client/src/App.tsx');
    const css = read('client/src/index.css');
    for (const file of ['Trips.tsx', 'SharedHomes.tsx', 'GroupFunds.tsx', 'TripDetail.tsx', 'SharedHomeDetail.tsx', 'GroupFundDetail.tsx', 'CreateGroupFund.tsx', 'PersonalBudget.tsx']) {
      const page = read(`client/src/pages/${file}`);
      expect(page.includes('AppSectionHeader') || page.includes('kharcha-page-header')).toBe(true);
    }
    expect(app).toContain('<BottomNav />');
    expect(css).toContain('.kharcha-app-shell');
    expect(css).toContain('.kharcha-page-header');
  });

  it('connects functional top actions and global feature routes without dead placeholders', () => {
    const app = read('client/src/App.tsx');
    const home = read('client/src/pages/Home.tsx');
    const bottomNav = read('client/src/components/BottomNav.tsx');
    expect(app).toContain('path={"/search"}');
    expect(app).toContain('path={"/notifications"}');
    expect(app).toContain('path={"/more"}');
    expect(home).toContain("navigate('/search')");
    expect(home).toContain("navigate('/notifications')");
    expect(bottomNav).toContain("navigate('/more')");
    expect(read('client/src/pages/Search.tsx')).toContain('getAllTrips');
    expect(read('client/src/pages/Notifications.tsx')).toContain('markAllNotificationsRead');
    expect(read('client/src/pages/More.tsx')).toContain('AppSettingsDialog');
  });

  it('defines the compact Kharcha visual system in shared presentation files', () => {
    const css = read('client/src/index.css');
    const card = read('client/src/components/ui/card.tsx');
    const button = read('client/src/components/ui/button.tsx');
    const dialog = read('client/src/components/ui/dialog.tsx');
    expect(css).toContain('--kharcha-page-gutter');
    expect(css).toContain('--kharcha-line: #d7e4dc');
    expect(css).toContain('prefers-reduced-motion');
    expect(card).toContain('shadow-[0_8px_24px_rgba(24,50,75,0.06)]');
    expect(button).toContain('min-h-10');
    expect(dialog).toContain('max-h-[calc(100dvh-2rem)]');
  });
});
