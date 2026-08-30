import { describe, expect, it } from 'vitest';
import { SUPPORTED_LANGUAGES, translate } from './LanguageContext';
import { auditEnglishSources } from './languageAudit';

describe('all-surface localization audit', () => {
  const coreKeys = [
    'myTrips', 'mySharedHomes', 'groupFunds', 'personalBudget', 'settings',
    'personalBudgetOverview', 'personalBudgetIncome', 'personalBudgetExpenses',
    'personalBudgetRecurring', 'personalBudgetReports', 'auditCreateGroupFund',
    'auditGroupFundsTitle', 'auditTotalCollected', 'auditMembersList',
    'auditCollectionSummary', 'auditMarkAsPaid', 'auditExpensesTab',
    'auditDashboardTab', 'auditSettlementTab',
  ] as const;

  it('resolves every audited key for every supported language', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      for (const key of Object.keys(auditEnglishSources)) {
        const value = translate(language.code, key as any);
        expect(value, `${language.code}:${key}`).toBeTruthy();
        expect(value, `${language.code}:${key} must not fall back to its key`).not.toBe(key);
      }
    }
  });

  it('switches core module tabs and headers away from English in every Indian locale', () => {
    for (const language of SUPPORTED_LANGUAGES.filter(item => item.code !== 'en')) {
      for (const key of coreKeys) {
        const localized = translate(language.code, key as any);
        const english = translate('en', key as any);
        expect(localized, `${language.code}:${key}`).not.toBe(english);
      }
    }
  });

  it('preserves interpolation values in translated headers and feedback', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      expect(translate(language.code, 'auditAddedFromContacts' as any, { count: 4 })).toContain('4');
      expect(translate(language.code, 'auditTotalPaidBy' as any, { name: 'Anu' })).toContain('Anu');
      expect(translate(language.code, 'auditRecurringFrom' as any, { frequency: 'Weekly', date: '2026-08-22' })).toContain('2026-08-22');
    }
  });
});


describe('Localized dynamic audit templates', () => {
  it('translates newly audited share, camera, payment, and import templates in every Indian locale', () => {
    const keys = ['auditShareCounts', 'auditCameraQrUnavailable', 'auditImportedMembersFromFile', 'auditNoValidMembersInFile', 'auditFileParseFailed'] as const;
    for (const language of SUPPORTED_LANGUAGES.filter(item => item.code !== 'en')) {
      for (const key of keys) {
        const localized = translate(language.code, key as any, { name: 'Trip', members: 2, expenses: 3, count: 2, amount: '100.00', status: 'paid', days: 2 });
        expect(localized, `${language.code}:${key}`).not.toBe(translate('en', key as any, { name: 'Trip', members: 2, expenses: 3, count: 2, amount: '100.00', status: 'paid', days: 2 }));
      }
    }
  });

  it('preserves brand and dynamic values in the newly localized templates', () => {
    expect(translate('ml', 'auditSharePayloadTitle' as any, { name: 'Trip' })).toContain('Trip');
    expect(translate('ml', 'auditShareCounts' as any, { members: 2, expenses: 3 })).toContain('2');
    expect(translate('ta', 'auditImportedMembersFromFile' as any, { count: 4 })).toContain('4');
    expect(translate('hi', 'auditMerchantPaymentSummary' as any, { name: 'Trip', amount: '100.00', status: 'paid' })).toContain('100.00');
  });
});


describe('Personal Finance enum localization', () => {
  it('translates quick-entry categories, recurring controls, statuses, and priorities in every Indian locale', () => {
    const keys = ['auditMilk', 'auditFood', 'auditTransport', 'pbWeekly', 'pbMonthly', 'pbPaidStatus', 'pbPending', 'pbLow', 'pbMedium', 'pbHigh'] as const;
    for (const language of SUPPORTED_LANGUAGES.filter(item => item.code !== 'en')) {
      for (const key of keys) {
        expect(translate(language.code, key as any), `${language.code}:${key}`).not.toBe(translate('en', key as any));
      }
    }
  });
});


describe('Shared Homes localization', () => {
  it('translates tabs, section headers, rooms, and member labels in every Indian locale', () => {
    const keys = [
      'sharedHomeOverview', 'sharedHomeExpenses', 'sharedHomeRent', 'sharedHomeBills',
      'sharedHomeGroceries', 'sharedHomeMembers', 'sharedHomeRooms', 'sharedHomeRecurring',
      'sharedHomeSettlements', 'sharedHomeReports', 'sharedHomeManage',
      'sharedHomeBillsUtilities', 'sharedHomeGroceriesHousehold', 'sharedHomeHouseholdExpenses',
      'sharedHomeRoom', 'sharedHomeMembersCount', 'sharedHomeAddRoom',
    ] as const;

    for (const language of SUPPORTED_LANGUAGES.filter(item => item.code !== 'en')) {
      for (const key of keys) {
        expect(translate(language.code, key as any), `${language.code}:${key}`).not.toBe(translate('en', key as any));
      }
    }
  });
});


describe('Trip split mode localization', () => {
  it('translates all split mode labels and hints in every Indian locale', () => {
    const keys = ['auditEqualAll', 'auditEqualSelected', 'auditCustomSplitMode', 'auditAllMembersIncluded', 'auditSelectPeople', 'auditCustomAmountsHint'] as const;
    for (const language of SUPPORTED_LANGUAGES.filter(item => item.code !== 'en')) {
      for (const key of keys) {
        expect(translate(language.code, key as any), `${language.code}:${key}`).not.toBe(translate('en', key as any));
      }
    }
  });
});


describe('Built-in display-value localization', () => {
  it('translates persisted system categories and report metrics in every Indian locale', () => {
    const keys = ['pbHousing', 'pbRent', 'pbGroceriesValue', 'pbGas', 'pbHealth', 'pbEducation', 'pbShopping', 'pbOther', 'auditUsed', 'auditSpent', 'auditLimit'] as const;
    for (const language of SUPPORTED_LANGUAGES.filter(item => item.code !== 'en')) {
      for (const key of keys) {
        expect(translate(language.code, key as any), `${language.code}:${key}`).not.toBe(translate('en', key as any));
      }
    }
  });

  it('does not translate custom user-entered names when no built-in mapping exists', () => {
    const customName = 'Abhi Office Mob';
    for (const language of SUPPORTED_LANGUAGES.filter(item => item.code !== 'en')) {
      expect(translate(language.code, customName as any)).toBe(customName);
    }
  });
});
