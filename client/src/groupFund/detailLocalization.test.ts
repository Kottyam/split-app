import { describe, it, expect } from 'vitest';
import { translate } from '../contexts/LanguageContext';

describe('Group Fund Detail Localization', () => {
  it('translates totalCollected and totalExpenses in Malayalam', () => {
    expect(translate('ml', 'totalCollected' as any)).toBe('ആകെ ശേഖരിച്ചത്');
    expect(translate('ml', 'totalExpenses' as any)).toBe('ആകെ ചെലവുകൾ');
    expect(translate('ml', 'remainingBalance' as any)).toBe('ബാക്കി ബാലൻസ്');
  });

  it('translates totalCollected and totalExpenses in Hindi', () => {
    expect(translate('hi', 'totalCollected' as any)).toBe('कुल संग्रहित');
    expect(translate('hi', 'totalExpenses' as any)).toBe('कुल खर्च');
    expect(translate('hi', 'remainingBalance' as any)).toBe('शेष राशि');
  });
});
