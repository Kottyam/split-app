import { describe, expect, it } from 'vitest';
import { SUPPORTED_LANGUAGES, translate } from './LanguageContext';
import { expenseFilterTranslations } from './expenseFilterTranslations';

const keys = Object.keys(expenseFilterTranslations.en);

describe('expense search/filter strings', () => {
  it('has every key for every supported language', () => {
    for (const { code } of SUPPORTED_LANGUAGES) {
      expect(Object.keys(expenseFilterTranslations[code] ?? {}).sort(), code).toEqual([...keys].sort());
    }
  });

  it('resolves through translate() and is localized (not English) in every Indian language', () => {
    for (const key of keys) expect(translate('en', key as any)).toBe(expenseFilterTranslations.en[key]);
    for (const { code } of SUPPORTED_LANGUAGES.filter(l => l.code !== 'en')) {
      for (const key of keys) {
        const value = translate(code, key as any, { count: 3, total: 9 });
        expect(value, `${code}:${key}`).toBeTruthy();
        expect(value, `${code}:${key}`).not.toBe(translate('en', key as any, { count: 3, total: 9 }));
      }
    }
  });

  it('keeps count/total interpolation in every language', () => {
    for (const { code } of SUPPORTED_LANGUAGES) {
      const value = translate(code, 'expFilterShowing' as any, { count: 3, total: 9 });
      expect(value, code).toContain('3');
      expect(value, code).toContain('9');
      expect(value, code).not.toContain('{{');
    }
  });
});
