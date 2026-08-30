import { describe, it, expect } from 'vitest';
import { translate } from '../contexts/LanguageContext';

describe('Group Fund Localization & Phrase Dictionaries', () => {
  it('translates group fund keys correctly in Malayalam', () => {
    const translated = translate('ml', 'groupFunds' as any);
    expect(translated).toBe('ഗ്രൂപ്പ് ഫണ്ടുകൾ');
  });

  it('translates create group fund correctly in Hindi', () => {
    const translated = translate('hi', 'createGroupFund' as any);
    expect(translated).toBe('समूह फंड बनाएं');
  });

  it('falls back gracefully for unknown keys', () => {
    const translated = translate('en', 'unknownKeyXYZ' as any);
    expect(translated).toBe('unknownKeyXYZ');
  });
});
