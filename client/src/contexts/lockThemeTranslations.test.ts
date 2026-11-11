import { describe, expect, it } from 'vitest';
import { SUPPORTED_LANGUAGES, translate } from './LanguageContext';
import { lockThemeEnglish, lockThemeTranslations } from './lockThemeTranslations';

describe('app lock + theme strings', () => {
  const keys = Object.keys(lockThemeEnglish);

  it('has a translation for every supported language', () => {
    for (const language of SUPPORTED_LANGUAGES.filter(item => item.code !== 'en')) {
      expect(Object.keys(lockThemeTranslations[language.code] ?? {}).sort(), language.code).toEqual([...keys].sort());
    }
  });

  it('resolves through t() and is not left in English', () => {
    for (const language of SUPPORTED_LANGUAGES.filter(item => item.code !== 'en')) {
      for (const key of keys) {
        const localized = translate(language.code, key as any, { count: 3, seconds: 30 });
        expect(localized, `${language.code}:${key}`).not.toBe(translate('en', key as any, { count: 3, seconds: 30 }));
      }
    }
  });

  it('keeps placeholders in every language', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      expect(translate(language.code, 'unlockAttemptsLeft' as any, { count: 3 })).toContain('3');
      expect(translate(language.code, 'unlockTooManyAttempts' as any, { seconds: 27 })).toContain('27');
    }
  });

  it('uses the English source text for English', () => {
    expect(translate('en', 'themeDark' as any)).toBe('Dark');
    expect(translate('en', 'forgotPin' as any)).toBe('Forgot PIN?');
  });
});
