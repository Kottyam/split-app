import { describe, expect, it } from 'vitest';
import { SUPPORTED_LANGUAGES, allTranslationKeys, englishSource, explicitTranslation } from './LanguageContext';

/**
 * Guards full localisation: every key must have a real translation in every
 * supported language. A value that is missing, identical to English, or that
 * still contains English words fails the build, so new UI strings cannot ship
 * half-translated.
 */

// Tokens that are legitimately written in Latin script inside translations.
const ALLOWED_LATIN = new Set([
  'UPI', 'PDF', 'QR', 'Kharcha', 'ID', 'OK', 'PIN', 'JSON', 'json', 'CSV', 'WhatsApp', 'SMS', 'URL', 'APK',
  'Android', 'GPay', 'PhonePe', 'Paytm', 'BHIM', 'Google', 'A-Z', 'Z-A', 'LPG', 'Excel', 'xlsx', 'xls',
  'EMI', 'SIP', 'ATM', 'GST', 'IFSC', 'AI', 'iPhone', 'iPad', 'Wi-Fi',
]);

// Keys whose English text is intentionally kept as-is in every language
// (brand name + registered tagline, or pure symbols/numbers/example IDs).
const SAME_AS_ENGLISH_OK = new Set(['brandLogoAlt']);

function latinWords(value: string): string[] {
  const stripped = value
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/upi:\/\/pay\S*/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[\w.-]+@[\w.-]+/g, '')
    .replace(/\.kharcha/g, '');
  return (stripped.match(/[A-Za-z][A-Za-z'-]*/g) ?? [])
    .map(word => word.replace(/-+$/, ''))
    .filter(word => !ALLOWED_LATIN.has(word));
}

const placeholders = (value: string) => (value.match(/\{\{\s*\w+\s*\}\}/g) ?? []).map(p => p.replace(/\s/g, '')).sort();

describe('locale coverage', () => {
  const keys = allTranslationKeys();
  const languages = SUPPORTED_LANGUAGES.filter(language => language.code !== 'en');

  it('has an English source for every key', () => {
    expect(keys.length).toBeGreaterThan(1000);
    for (const key of keys) expect(englishSource(key), key).toBeTruthy();
  });

  for (const language of languages) {
    it(`${language.code} (${language.label}) translates every key`, () => {
      const problems: string[] = [];
      for (const key of keys) {
        const english = englishSource(key)!;
        const value = explicitTranslation(language.code, key);
        if (!value) { problems.push(`${key}: missing`); continue; }
        if (SAME_AS_ENGLISH_OK.has(key)) continue;
        if (value === english && latinWords(english).length > 0) { problems.push(`${key}: identical to English`); continue; }
        const latin = latinWords(value);
        if (latin.length) problems.push(`${key}: English words left (${latin.join(', ')}) in "${value}"`);
        if (placeholders(value).join() !== placeholders(english).join()) problems.push(`${key}: placeholders differ from English (${placeholders(english).join() || 'none'})`);
      }
      expect(problems, problems.slice(0, 25).join('\n')).toEqual([]);
    });
  }
});
