import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getHelpGuideCopy } from './helpGuideContent';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.resolve(root, relativePath), 'utf8');
const languages = ['en', 'ml', 'hi', 'ta', 'kn', 'te', 'mr', 'bn', 'gu', 'pa', 'or', 'as'] as const;

describe('Help & Guide experience', () => {
  it('keeps the four feature sections in the required order for every language', () => {
    const expected = ['trips', 'sharedHomes', 'groupFunds', 'personalBudget'];
    for (const language of languages) {
      const copy = getHelpGuideCopy(language);
      expect(copy.sections.map(section => section.id)).toEqual(expected);
      expect(copy.sections.every(section => section.title.length > 0 && section.paragraphs.length >= 3)).toBe(true);
      expect(copy.backupWarning.length).toBeGreaterThan(20);
    }
  });

  it('keeps Help content generic and avoids platform-specific sharing claims', () => {
    for (const language of languages) {
      const text = JSON.stringify(getHelpGuideCopy(language)).toLowerCase();
      expect(text).not.toContain('whatsapp');
      expect(text).not.toContain('telegram');
    }
  });

  it('uses one Settings Help entry and the hasSeenHelpGuide first-launch flag', () => {
    const settings = read('client/src/components/AppSettingsDialogExtended.tsx');
    const home = read('client/src/pages/Home.tsx');
    expect(settings.match(/setShowHelpGuide\(true\)/g)?.length ?? 0).toBe(1);
    expect(home).toContain("localStorage.getItem('hasSeenHelpGuide')");
    expect(home).toContain("localStorage.setItem('hasSeenHelpGuide', 'true')");
    expect(home).toContain('<HelpGuideModal');
  });

  it('keeps HelpGuideModal free of hard-coded feature body copy', () => {
    const modal = read('client/src/components/HelpGuideModal.tsx');
    expect(modal).toContain('getHelpGuideCopy(language)');
    expect(modal).not.toContain('My Trips helps you organize');
    expect(modal).not.toContain('Shared Homes is designed');
  });
});
