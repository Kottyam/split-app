import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Router } from 'wouter';
import { describe, expect, it } from 'vitest';
import SharedHomeDetail from '@/pages/SharedHomeDetail';
import SharedHomeSharedView from '@/pages/SharedHomeSharedView';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { createSharedHomeSnapshot, encodeSharedHomeSnapshot } from './share';
import type { SharedHome } from './types';
import { saveSharedHome } from './storage';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const home: SharedHome = {
  id: 'home-render',
  type: 'shared_home',
  name: 'Render Home',
  homeType: 'flat',
  startDate: Date.UTC(2026, 7, 1),
  members: [],
  rooms: [],
  rentPeriods: [],
  expenses: [],
  recurringRules: [],
  settlements: [],
  months: {},
  activity: [],
  createdAt: Date.UTC(2026, 7, 1),
  updatedAt: Date.UTC(2026, 7, 1),
};
describe('Shared Home localization surfaces', () => {
  it('renders SharedHomeDetail through the localization provider', () => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: new MemoryStorage() });
    saveSharedHome(home);
    const markup = renderToStaticMarkup(createElement(
      Router,
      { ssrPath: '/shared-home/home-render' },
      createElement(LanguageProvider, { initialLanguage: 'en' }, createElement(SharedHomeDetail)),
    ));

    expect(markup).toContain('Render Home');
    expect(markup).toContain('kharcha-page-header');
  });

  it('renders the read-only shared route through the localization provider', () => {
    const payload = encodeSharedHomeSnapshot(createSharedHomeSnapshot(home, 'full-group'));
    const markup = renderToStaticMarkup(createElement(
      Router,
      { ssrPath: `/shared-home-share/${payload}` },
      createElement(LanguageProvider, { initialLanguage: 'ml' }, createElement(SharedHomeSharedView)),
    ));

    expect(markup).toContain('Render Home');
    expect(markup).toContain('കാണാൻ മാത്രം');
    expect(markup).toContain('കാണാൻ മാത്രം');
  });
});
