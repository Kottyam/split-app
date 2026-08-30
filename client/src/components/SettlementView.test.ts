import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import SettlementView from './SettlementView';
import { LanguageProvider } from '@/contexts/LanguageContext';
import type { TripSummary } from '@/types';

const emptySummary: TripSummary = {
  tripId: 'trip-1',
  totalExpenses: 0,
  categoryBreakdown: {
    food: 0,
    transport: 0,
    hotel: 0,
    shopping: 0,
    entertainment: 0,
    others: 0,
  },
  memberSpend: {},
  memberOwes: {},
  debts: [],
  settlements: [],
};

describe('SettlementView localization', () => {
  it('renders the localized settled state', () => {
    const markup = renderToStaticMarkup(
      createElement(
        LanguageProvider,
        { initialLanguage: 'ml' },
        createElement(SettlementView, { summary: emptySummary }),
      ),
    );

    expect(markup).toContain('✨ എല്ലാം സെറ്റിൽ ചെയ്തു!');
    expect(markup).toContain('പണമടയ്ക്കേണ്ടതില്ല');
  });
});
