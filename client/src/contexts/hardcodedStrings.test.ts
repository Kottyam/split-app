import path from 'path';
import { describe, expect, it } from 'vitest';
import { scanHardcodedStrings } from '../../../scripts/i18n/hardcodedScan';
import { getHelpGuideCopy } from '@/lib/helpGuideContent';
import { SUPPORTED_LANGUAGES } from './LanguageContext';

/**
 * Fails when new user-visible English is hardcoded in JSX, toasts, alerts or
 * label-like props instead of going through t(). Entries below are reviewed
 * exceptions (dev-only demo pages, brand tagline, internal defaults that every
 * caller overrides with translated text).
 */
const IGNORED_FILES = [
  'pages/ComponentShowcase.tsx', // developer demo page, not reachable from the app
  'components/DashboardLayout.tsx', // unused template scaffold
  'components/AIChatBox.tsx', // unused template scaffold
  'components/Map.tsx', // unused template scaffold
];

const ALLOWED_HITS: RegExp[] = [
  /components\/InstallPromptDialog\.tsx:\d+:jsx: (Split Smart|Live|Smart)$/, // brand tagline
  /lib\/categories\.ts:\d+:prop:label: /, // internal ids; UI renders t(category)
  /lib\/groupFundMemberExcel\.ts:\d+:prop:name: \[Content_Types\]\.xml$/, // xlsx zip entry name
  /lib\/helpGuideContent\.ts:\d+:prop:(title|subtitle): /, // English copy; other languages localised in-file (checked below)
  /pages\/ImportKharcha\.tsx:\d+:attr:placeholder: https:\/\//, // example URL
  /pages\/Notifications\.tsx:\d+:expr: ring-/, // CSS classes
  /pages\/SharedHomeDetail\.tsx:\d+:prop:label: /, // tab ids; rendered through tabTranslationKeys
  /sharedHome\/paymentRequest\.ts:\d+:prop:heading: /, // default; callers pass translated labels
];

describe('hardcoded UI strings', () => {
  it('routes every user-visible string through i18n', () => {
    const root = path.resolve(__dirname, '..');
    const hits = scanHardcodedStrings(root)
      .map(hit => path.relative(root, hit.split(':')[0]) + hit.slice(hit.indexOf(':')))
      .filter(hit => !IGNORED_FILES.some(file => hit.startsWith(file + ':')))
      .filter(hit => !ALLOWED_HITS.some(pattern => pattern.test(hit)));
    expect(hits, hits.slice(0, 30).join('\n')).toEqual([]);
  });

  it('localises the help guide in every language', () => {
    const english = JSON.stringify(getHelpGuideCopy('en'));
    for (const language of SUPPORTED_LANGUAGES.filter(l => l.code !== 'en')) {
      const copy = getHelpGuideCopy(language.code);
      const text = [copy.title, copy.subtitle, copy.backupWarning, copy.gotIt, copy.continue, copy.close, ...copy.sections.flatMap(s => [s.title, ...s.paragraphs])].join(' ');
      expect(JSON.stringify(copy), language.code).not.toEqual(english);
      expect(text.match(/[A-Za-z]{2,}/g)?.filter(w => w !== 'Kharcha') ?? [], language.code).toEqual([]);
    }
  });
});
