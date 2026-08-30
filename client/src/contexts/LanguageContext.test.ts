import { describe, expect, it } from 'vitest';
import { SUPPORTED_LANGUAGES, translate } from './LanguageContext';

describe('Kharcha language support', () => {
  it('includes English and the major Indian languages in the selector catalog', () => {
    expect(SUPPORTED_LANGUAGES.map(language => language.code)).toEqual([
      'en', 'ml', 'hi', 'ta', 'kn', 'te', 'mr', 'bn', 'gu', 'pa', 'or', 'as',
    ]);
    expect(SUPPORTED_LANGUAGES.find(language => language.code === 'ml')?.nativeLabel).toBe('മലയാളം');
    expect(SUPPORTED_LANGUAGES.find(language => language.code === 'hi')?.nativeLabel).toBe('हिन्दी');
  });

  it('translates core labels and interpolates member counts', () => {
    expect(translate('ml', 'createTrip')).toBe('യാത്ര സൃഷ്ടിക്കുക');
    expect(translate('hi', 'membersCount', { count: 3 })).toBe('3 सदस्य');
    expect(translate('ta', 'shareThisTrip')).toBe('இந்தப் பயணத்தைப் பகிரவும்');
  });

  it('falls back to English when a future translation key is not yet translated', () => {
    expect(translate('ml', 'splitExpenses')).toBe('ചെലവ് പങ്കിടൂ, യാത്ര സ്മാർട്ടാക്കൂ');
    expect(translate('en', 'copyLink')).toBe('Copy Link');
  });

  it('exposes the clear Shared Home recurring budget question label', () => {
    expect(translate('en', 'sharedHomeIncludeInBudgetQuestion')).toBe('Should this recurring expense reduce the Shared Home budget?');
    expect(translate('ml', 'sharedHomeIncludeInBudgetQuestion')).toBeTruthy();
  });

  it('resolves Shared Home headline labels for every supported language', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      expect(translate(language.code, 'sharedHome')).toBeTruthy();
      expect(translate(language.code, 'sharedHomeOverview')).toBeTruthy();
      expect(translate(language.code, 'sharedHomeShare')).toBeTruthy();
    }
    expect(translate('ml', 'sharedHome')).toBe('ഷെയർഡ് ഹോം');
    expect(translate('hi', 'sharedHome')).toBe('साझा घर');
  });

  it('resolves Edit & Sync labels for every supported language', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      expect(translate(language.code, 'editAndSyncTitle' as any)).toBeTruthy();
      expect(translate(language.code, 'editSyncRecipientDescription' as any)).toBeTruthy();
      expect(translate(language.code, 'editSyncSendBack' as any)).toBeTruthy();
      expect(translate(language.code, 'editSyncReviewChanges' as any)).toBeTruthy();
      expect(translate(language.code, 'editSyncSynchronize' as any)).toBeTruthy();
    }
    expect(translate('ml', 'editAndSyncTitle' as any)).toBe('എഡിറ്റ് & സിങ്ക്');
    expect(translate('hi', 'editAndSyncTitle' as any)).toBe('एडिट और सिंक');
  });

  it('resolves Home landing-page strings for every supported language', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      expect(translate(language.code, 'whatManage')).toBeTruthy();
      expect(translate(language.code, 'myTrips')).toBeTruthy();
      expect(translate(language.code, 'mySharedHomes')).toBeTruthy();
      expect(translate(language.code, 'tripsDescription')).toBeTruthy();
    }
    expect(translate('ml', 'whatManage')).toBe('നിങ്ങൾക്ക് എന്താണ് നിയന്ത്രിക്കേണ്ടത്?');
    expect(translate('hi', 'whatManage')).toBe('आप क्या प्रबंधित करना चाहते हैं?');
  });
});
