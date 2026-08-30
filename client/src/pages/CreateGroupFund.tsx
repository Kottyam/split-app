import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { saveGroupFund } from '@/groupFund/storage';
import type { GroupFund, GroupFundPurpose, ContributionType, RecurringFrequency, AmountType, WeeklyStartDay, MonthlyCycleType, ProrationRule, FortnightlyCycleBoundary, CustomIntervalUnit, MissedCollectionRule } from '@/groupFund/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppSectionHeader from '@/components/AppSectionHeader';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CreateGroupFund() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState<GroupFundPurpose>('Office');
  const [customPurpose, setCustomPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [startingBalance, setStartingBalance] = useState('');
  const [contributionType, setContributionType] = useState<ContributionType>('monthly');
  const [defaultContributionAmount, setDefaultContributionAmount] = useState('');

  // Recurring collection states
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>('Monthly');
  const [amountType, setAmountType] = useState<AmountType>('Default Amount');
  const [weeklyStartDay, setWeeklyStartDay] = useState<WeeklyStartDay>('Monday');
  const [monthlyCycleType, setMonthlyCycleType] = useState<MonthlyCycleType>('Calendar Month (1st to End)');
  const [prorationRule, setProrationRule] = useState<ProrationRule>('Proportionate (Remaining Days)');
  const [fortnightlyCycleBoundary, setFortnightlyCycleBoundary] = useState<FortnightlyCycleBoundary>('Start-Date Based — Every 14 Days');
  const [customInterval, setCustomInterval] = useState('1');
  const [customIntervalUnit, setCustomIntervalUnit] = useState<CustomIntervalUnit>('days');
  const [durationMode, setDurationMode] = useState<'none' | 'endDate' | 'cycles'>('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [recurrenceNumberOfCycles, setRecurrenceNumberOfCycles] = useState('');
  const [gracePeriodDays, setGracePeriodDays] = useState<0 | 1 | 2 | 3 | 7>(0);
  const [missedCollectionRule, setMissedCollectionRule] = useState<MissedCollectionRule>('carry_forward');
  const [collectionStartDate, setCollectionStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [collectionPeriodMode, setCollectionPeriodMode] = useState<'past' | 'future'>('future');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t('auditFundNameRequired' as any));
      return;
    }

    const newFund: GroupFund = {
      id: nanoid(),
      type: 'group_fund',
      name: name.trim(),
      purpose,
      customPurpose: purpose === 'Other' ? customPurpose.trim() || undefined : undefined,
      description: description.trim() || undefined,
      targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
      startingBalance: startingBalance ? parseFloat(startingBalance) : 0,
      contributionType,
      defaultContributionAmount: parseFloat(defaultContributionAmount) || 0,
      isRecurring,
      recurringFrequency: isRecurring ? frequency : undefined,
      amountType: isRecurring ? amountType : undefined,
      weeklyStartDay: isRecurring && frequency === 'Weekly' ? weeklyStartDay : undefined,
      fortnightlyCycleBoundary: isRecurring && frequency === 'Fortnightly' ? fortnightlyCycleBoundary : undefined,
      customInterval: isRecurring && frequency === 'Custom' ? Math.max(1, parseInt(customInterval, 10) || 1) : undefined,
      customIntervalUnit: isRecurring && frequency === 'Custom' ? customIntervalUnit : undefined,
      monthlyCycleType: isRecurring && frequency === 'Monthly' ? monthlyCycleType : undefined,
      prorationRule: isRecurring && amountType === 'Default Amount' ? prorationRule : undefined,
      collectionStartDate: isRecurring ? collectionStartDate : undefined,
      collectionPeriodMode: isRecurring && frequency !== 'Daily' ? collectionPeriodMode : undefined,
      collectionTiming: isRecurring ? (collectionPeriodMode === 'past' ? 'previous' : 'advance') : undefined,
      recurrenceEndDate: isRecurring && durationMode === 'endDate' ? recurrenceEndDate || undefined : undefined,
      recurrenceNumberOfCycles: isRecurring && durationMode === 'cycles' ? Math.max(1, parseInt(recurrenceNumberOfCycles, 10) || 1) : undefined,
      gracePeriodDays: isRecurring ? gracePeriodDays : undefined,
      missedCollectionRule: isRecurring ? missedCollectionRule : undefined,
      members: [],
      contributions: [],
      expenses: [],
      closedPeriods: [],
      activity: [
        { id: nanoid(), message: `Created group fund "${name.trim()}"`, createdAt: Date.now() },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveGroupFund(newFund);
    toast.success(t('auditFundCreated' as any));
    navigate(`/group-funds/${newFund.id}`);
  };

  return (
    <div className="min-h-screen bg-kharcha-cream px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-xl space-y-6">
        <AppSectionHeader
          title={t('auditCreateGroupFund' as any)}
          onBack={() => navigate('/')}
          backLabel={t('backToKharcha' as any)}
        />

        <Card className="rounded-2xl border border-[#d7e4dc] bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fund-name" className="font-bold text-kharcha-navy">{t('auditFundName' as any)} *</Label>
              <Input
                id="fund-name"
                placeholder={t('auditFundNamePlaceholder' as any)}
                value={name}
                onChange={e => setName(e.target.value)}
                className="border border-[#d7e4dc] rounded-xl mt-1"
                autoFocus
                required
              />
              <p className="text-xs text-gray-500 mt-1">{t('auditFundNameHelp' as any)}</p>
            </div>

            <div>
              <Label className="font-bold text-kharcha-navy">{t('auditPurpose' as any)}</Label>
              <Select value={purpose} onValueChange={(v: any) => setPurpose(v)}>
                <SelectTrigger className="border border-[#d7e4dc] rounded-xl mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Office">{t('auditOffice' as any)}</SelectItem>
                  <SelectItem value="Club">{t('auditClub' as any)}</SelectItem>
                  <SelectItem value="Outing">{t('auditOuting' as any)}</SelectItem>
                  <SelectItem value="Celebration">{t('auditCelebration' as any)}</SelectItem>
                  <SelectItem value="Welfare">{t('auditWelfare' as any)}</SelectItem>
                  <SelectItem value="Common Collection">{t('auditCommonCollection' as any)}</SelectItem>
                  <SelectItem value="Birthday">{t('auditBirthday' as any)}</SelectItem>
                  <SelectItem value="Sports">{t('auditSports' as any)}</SelectItem>
                  <SelectItem value="Other">{t('auditOther' as any)}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {purpose === 'Other' && (
              <div>
                <Label className="font-bold text-kharcha-navy">{t('auditCustomPurpose' as any)}</Label>
                <Input
                  placeholder={t('auditSpecifyPurpose' as any)}
                  value={customPurpose}
                  onChange={e => setCustomPurpose(e.target.value)}
                  className="border border-[#d7e4dc] rounded-xl mt-1"
                />
              </div>
            )}

            <div>
              <Label className="font-bold text-kharcha-navy">{t('auditDescriptionOptional' as any)}</Label>
              <Input
                placeholder={t('auditDescriptionPlaceholder' as any)}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="border border-[#d7e4dc] rounded-xl mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-bold text-kharcha-navy">{t('auditTargetAmount' as any)} (₹)</Label>
                <Input
                  type="number"
                  placeholder={t('auditOptional' as any)}
                  value={targetAmount}
                  onChange={e => setTargetAmount(e.target.value)}
                  className="border border-[#d7e4dc] rounded-xl mt-1"
                />
              </div>
              <div>
                <Label className="font-bold text-kharcha-navy">{t('auditStartingBalance' as any)} (₹)</Label>
                <Input
                  type="number"
                  placeholder={t('auditStartingBalance' as any)}
                  value={startingBalance}
                  onChange={e => setStartingBalance(e.target.value)}
                  className="border border-[#d7e4dc] rounded-xl mt-1"
                />
              </div>
            </div>

            {/* RECURRING COLLECTION TOGGLE */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-[#d7e4dc] rounded-xl shadow-sm">
              <input
                type="checkbox"
                id="recurring-toggle"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                className="w-5 h-5 accent-[#16834b] cursor-pointer"
              />
              <label htmlFor="recurring-toggle" className="font-black text-kharcha-navy cursor-pointer select-none">
                {t('recurringCollection' as any) !== 'recurringCollection' ? t('recurringCollection' as any) : 'Recurring Collection'}
              </label>
            </div>

            {/* IF RECURRING COLLECTION = ON: SHOW FREQUENCY, START DATE, CYCLE BOUNDARIES & AMOUNT TYPE */}
            {isRecurring ? (
              <div className="space-y-4 p-4 bg-emerald-50/50 border border-[#d7e4dc] rounded-2xl shadow-sm">
                <div>
                  <Label htmlFor="collection-start-date" className="font-bold text-kharcha-navy">{t('auditCollectionStartDate' as any)}</Label>
                  <Input
                    id="collection-start-date"
                    type="date"
                    value={collectionStartDate}
                    onChange={e => setCollectionStartDate(e.target.value)}
                    className="border border-[#d7e4dc] rounded-xl mt-1 bg-white"
                    required={isRecurring}
                  />
                  <p className="text-xs text-gray-600 mt-1">{t('auditCollectionStartDateHelp' as any)}</p>
                </div>

                <div>
                  <Label className="font-bold text-kharcha-navy">{t('auditFrequency' as any)}</Label>
                  <div className="grid min-w-0 grid-cols-3 gap-2 mt-1">
                    {(['Daily', 'Weekly', 'Monthly', 'Custom'] as RecurringFrequency[]).map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFrequency(f)}
                        className={`min-w-0 break-words border border-[#d7e4dc] px-1 py-2 rounded-xl font-bold text-sm leading-tight transition-all shadow-sm ${
                          frequency === f ? 'bg-[#16834b] text-white' : 'bg-white text-kharcha-navy hover:bg-gray-100'
                        }`}
                      >
                        {f === 'Daily' ? t('auditDaily' as any) : f === 'Weekly' ? t('auditWeekly' as any) : f === 'Monthly' ? t('auditMonthly' as any) : t('auditCustom' as any)}
                      </button>
                    ))}
                  </div>
                </div>

                {frequency === 'Weekly' && (
                  <div>
                    <Label className="font-bold text-kharcha-navy">{t('auditWeeklyCycleBoundary' as any)}</Label>
                    <Select value={weeklyStartDay} onValueChange={(v: any) => setWeeklyStartDay(v)}>
                      <SelectTrigger className="border border-[#d7e4dc] rounded-xl mt-1 bg-white font-bold text-kharcha-navy w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                        <SelectValue className="truncate" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-[#d7e4dc] font-bold w-[var(--radix-select-trigger-width)] max-w-full">
                        <SelectItem value="Monday">{t('auditMondaySunday' as any)}</SelectItem>
                        <SelectItem value="Sunday">{t('auditSundaySaturday' as any)}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {frequency === 'Monthly' && (
                  <div>
                    <Label className="font-bold text-kharcha-navy">{t('auditMonthlyCycleBoundary' as any)}</Label>
                    <Select value={monthlyCycleType} onValueChange={(v: any) => setMonthlyCycleType(v)}>
                      <SelectTrigger className="border border-[#d7e4dc] rounded-xl mt-1 bg-white font-bold text-kharcha-navy w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                        <SelectValue className="truncate" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-[#d7e4dc] font-bold w-[var(--radix-select-trigger-width)] max-w-full">
                        <SelectItem value="Calendar Month (1st to End)">{t('auditCalendarMonth' as any)}</SelectItem>
                        <SelectItem value="Join-Date Cycle (e.g. 15th to 14th)">{t('auditJoinDateCycle' as any)}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {frequency === 'Fortnightly' && (
                  <div>
                    <Label className="font-bold text-kharcha-navy">{t('auditWeeklyCycleBoundary' as any)}</Label>
                    <Select value={fortnightlyCycleBoundary} onValueChange={(v: any) => setFortnightlyCycleBoundary(v)}>
                      <SelectTrigger className="border border-[#d7e4dc] rounded-xl mt-1 bg-white font-bold text-kharcha-navy w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white border border-[#d7e4dc] font-bold w-[var(--radix-select-trigger-width)] max-w-full">
                        <SelectItem value="Monday-based 14-day cycle">{t('auditMondaySunday' as any)}</SelectItem>
                        <SelectItem value="Sunday-based 14-day cycle">{t('auditSundaySaturday' as any)}</SelectItem>
                        <SelectItem value="Start-Date Based — Every 14 Days">{t('auditCollectionStartDate' as any)}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {frequency === 'Custom' && (
                  <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[1fr_1.5fr]">
                    <div>
                      <Label className="font-bold text-kharcha-navy">{t('auditCustomEveryN' as any)}</Label>
                      <Input type="number" min="1" value={customInterval} onChange={e => setCustomInterval(e.target.value)} className="border border-[#d7e4dc] rounded-xl mt-1 bg-white" />
                    </div>
                    <div>
                      <Label className="font-bold text-kharcha-navy">{t('auditFrequency' as any)}</Label>
                      <Select value={customIntervalUnit} onValueChange={(v: any) => setCustomIntervalUnit(v)}>
                        <SelectTrigger className="border border-[#d7e4dc] rounded-xl mt-1 bg-white font-bold text-kharcha-navy"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white border border-[#d7e4dc] font-bold">
                          <SelectItem value="days">{t('pbDays' as any)}</SelectItem>
                          <SelectItem value="weeks">{t('pbWeeks' as any)}</SelectItem>
                          <SelectItem value="months">{t('pbMonths' as any)}</SelectItem>
                          <SelectItem value="years">{t('pbYears' as any)}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {isRecurring && frequency !== 'Daily' && (
                  <div>
                    <Label className="font-bold text-kharcha-navy">{t('auditCollectionTiming' as any)}</Label>
                    <div className="mt-1 grid min-w-0 grid-cols-2 gap-2">
                      <button type="button" onClick={() => setCollectionPeriodMode('past')} className={`min-w-0 break-words rounded-xl border border-[#d7e4dc] px-2 py-2 text-sm font-bold leading-tight shadow-sm ${collectionPeriodMode === 'past' ? 'bg-[#16834b] text-white' : 'bg-white text-kharcha-navy hover:bg-gray-100'}`}>{t('auditPreviousPeriod' as any)}</button>
                      <button type="button" onClick={() => setCollectionPeriodMode('future')} className={`min-w-0 break-words rounded-xl border border-[#d7e4dc] px-2 py-2 text-sm font-bold leading-tight shadow-sm ${collectionPeriodMode === 'future' ? 'bg-[#16834b] text-white' : 'bg-white text-kharcha-navy hover:bg-gray-100'}`}>{t('auditCollectInAdvance' as any)}</button>
                    </div>
                  </div>
                )}

                {isRecurring && (
                  <div>
                    <Label className="font-bold text-kharcha-navy">{t('auditCollectionDuration' as any)}</Label>
                    <div className="mt-1 grid grid-cols-3 gap-2">
                      {(['none', 'endDate', 'cycles'] as const).map(mode => (
                        <button key={mode} type="button" onClick={() => setDurationMode(mode)} className={`rounded-xl border border-[#d7e4dc] px-2 py-2 text-xs font-bold shadow-sm ${durationMode === mode ? 'bg-[#16834b] text-white' : 'bg-white text-kharcha-navy hover:bg-gray-100'}`}>
                          {mode === 'none' ? t('auditNoEndDate' as any) : mode === 'endDate' ? t('auditEndDate' as any) : t('auditNumberOfCollections' as any)}
                        </button>
                      ))}
                    </div>
                    {durationMode === 'endDate' && <Input type="date" value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)} className="border border-[#d7e4dc] rounded-xl mt-2 bg-white" />}
                    {durationMode === 'cycles' && <Input type="number" min="1" value={recurrenceNumberOfCycles} onChange={e => setRecurrenceNumberOfCycles(e.target.value)} placeholder={t('pbOccurrences' as any)} className="border border-[#d7e4dc] rounded-xl mt-2 bg-white" />}
                  </div>
                )}

                {isRecurring && (
                  <details className="rounded-xl border border-[#d7e4dc] bg-white p-3">
                    <summary className="cursor-pointer font-black text-kharcha-navy">{t('auditAdvancedRecurrence' as any)}</summary>
                    <div className="mt-3 space-y-3">
                      <div>
                        <Label className="font-bold text-kharcha-navy">{t('auditGracePeriod' as any)}</Label>
                        <Select value={String(gracePeriodDays)} onValueChange={value => setGracePeriodDays(Number(value) as 0 | 1 | 2 | 3 | 7)}>
                          <SelectTrigger className="mt-1 w-full rounded-xl border border-[#d7e4dc] bg-white font-bold text-kharcha-navy"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-white font-bold">
                            <SelectItem value="0">{t('auditNoGracePeriod' as any)}</SelectItem>
                            <SelectItem value="1">1 {t('pbDays' as any)}</SelectItem>
                            <SelectItem value="2">2 {t('pbDays' as any)}</SelectItem>
                            <SelectItem value="3">3 {t('pbDays' as any)}</SelectItem>
                            <SelectItem value="7">7 {t('pbDays' as any)}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="font-bold text-kharcha-navy">{t('auditMissedCollection' as any)}</Label>
                        <Select value={missedCollectionRule} onValueChange={value => setMissedCollectionRule(value as MissedCollectionRule)}>
                          <SelectTrigger className="mt-1 w-full rounded-xl border border-[#d7e4dc] bg-white font-bold text-kharcha-navy"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-white font-bold">
                            <SelectItem value="carry_forward">{t('auditCarryForward' as any)}</SelectItem>
                            <SelectItem value="overdue">{t('auditKeepOverdue' as any)}</SelectItem>
                            <SelectItem value="skip_cycle">{t('auditSkipCycle' as any)}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </details>
                )}

                <div>
                  <Label className="font-bold text-kharcha-navy">{t('auditAmountType' as any)}</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {(['Default Amount', 'Variable Amount'] as AmountType[]).map(amountTypeOption => (
                      <button
                        key={amountTypeOption}
                        type="button"
                        onClick={() => setAmountType(amountTypeOption)}
                        className={`border border-[#d7e4dc] py-2.5 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm ${
                          amountType === amountTypeOption ? 'bg-[#16834b] text-white' : 'bg-white text-kharcha-navy hover:bg-gray-100'
                        }`}
                      >
                        {amountTypeOption === 'Default Amount' ? t('auditDefaultAmount' as any) : t('auditVariableAmount' as any)}
                      </button>
                    ))}
                  </div>
                </div>

                {amountType === 'Default Amount' ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="font-bold text-kharcha-navy">{t('auditDefaultAmount' as any)} (₹)</Label>
                      <Input
                        type="number"
                        placeholder={t('auditDefaultAmountPlaceholder' as any)}
                        value={defaultContributionAmount}
                        onChange={e => setDefaultContributionAmount(e.target.value)}
                        className="border border-[#d7e4dc] rounded-xl mt-1 bg-white"
                        required={isRecurring && amountType === 'Default Amount'}
                      />
                    </div>
                    <div>
                      <Label className="font-bold text-kharcha-navy">{t('auditProrationRule' as any)}</Label>
                      <Select value={prorationRule} onValueChange={(v: any) => setProrationRule(v)}>
                        <SelectTrigger className="border border-[#d7e4dc] rounded-xl mt-1 bg-white font-bold text-kharcha-navy">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-[#d7e4dc] font-bold w-[var(--radix-select-trigger-width)] max-w-full">
                          <SelectItem value="Proportionate (Remaining Days)">{t('auditProportionateProration' as any)}</SelectItem>
                          <SelectItem value="Full Amount">{t('auditFullAmountProration' as any)}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-600 mt-1">
                        {t('auditProrationHelp' as any)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-gray-700">
                    ℹ️ {t('auditVariableAmountHelp' as any)}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <Label className="font-bold text-kharcha-navy">{t('auditDefaultAmount' as any)} (₹)</Label>
                <Input
                  type="number"
                  placeholder={t('auditDefaultAmountPlaceholder' as any)}
                  value={defaultContributionAmount}
                  onChange={e => setDefaultContributionAmount(e.target.value)}
                  className="border border-[#d7e4dc] rounded-xl mt-1"
                />
              </div>
            )}

            <Button type="submit" className="w-full bg-[#16834b] text-white font-black py-3 rounded-xl border border-[#d7e4dc] shadow-sm hover:bg-green-700">
              {t('auditCreateGroupFund' as any)}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
