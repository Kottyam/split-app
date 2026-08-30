import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/contexts/LanguageContext';
import type { HouseholdExpenseKind, RecurringRule, SharedHome } from '@/sharedHome/types';
import { nanoid } from 'nanoid';

interface Props {
  open: boolean;
  home: SharedHome;
  initial?: RecurringRule;
  onOpenChange: (open: boolean) => void;
  onSave: (rule: RecurringRule) => void;
}

const recurringCategories: Array<{ value: string; key: TranslationKey }> = [
  { value: 'Rent', key: 'sharedHomeRent' },
  { value: 'Food', key: 'sharedHomeCategoryFood' },
  { value: 'Groceries', key: 'sharedHomeGroceries' },
  { value: 'Electricity', key: 'sharedHomeCategoryElectricity' },
  { value: 'Gas', key: 'sharedHomeCategoryGas' },
  { value: 'Water', key: 'sharedHomeCategoryWater' },
  { value: 'Wi-Fi / Internet', key: 'sharedHomeCategoryInternet' },
  { value: 'Cleaning', key: 'sharedHomeCategoryCleaning' },
  { value: 'Maintenance', key: 'sharedHomeCategoryMaintenance' },
  { value: 'Transport', key: 'pbTransport' as TranslationKey },
  { value: 'Other', key: 'sharedHomeCategoryOther' },
];

function dateInput(value: number | undefined): string {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

function dateTimestamp(value: string): number | undefined {
  return value ? new Date(`${value}T00:00:00Z`).getTime() : undefined;
}

export default function SharedHomeRecurringDialog({ open, home, initial, onOpenChange, onSave }: Props) {
  const { t } = useLanguage();
  const activeMembers = useMemo(() => home.members.filter(member => member.isActive), [home.members]);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<HouseholdExpenseKind>('bill');
  const [category, setCategory] = useState('Other');
  const [amountMode, setAmountMode] = useState<'fixed' | 'variable'>('fixed');
  const [fixedAmount, setFixedAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sharedBy, setSharedBy] = useState<string[]>([]);
  const [autoAdd, setAutoAdd] = useState(true);
  const [includeInBudget, setIncludeInBudget] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setKind(initial?.kind ?? 'bill');
    setCategory(initial?.category ?? 'Other');
    setAmountMode(initial?.amountMode ?? 'fixed');
    setFixedAmount(initial?.fixedAmount === undefined ? '' : String(initial.fixedAmount));
    setStartDate(dateInput(initial?.startDate));
    setEndDate(dateInput(initial?.endDate));
    setSharedBy(initial?.sharedBy?.length ? initial.sharedBy : activeMembers.map(member => member.id));
    setAutoAdd(initial?.autoAdd ?? true);
    setIncludeInBudget(initial?.includeInBudget !== false);
    setError('');
  }, [open, initial, activeMembers]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(fixedAmount);
    const start = dateTimestamp(startDate);
    const end = dateTimestamp(endDate);
    if (!name.trim() || !sharedBy.length || (amountMode === 'fixed' && (!amount || amount <= 0))) {
      setError(t('sharedHomeInvalidExpense'));
      return;
    }
    if (start !== undefined && end !== undefined && end < start) {
      setError(t('sharedHomeInvalidExpense'));
      return;
    }
    const now = Date.now();
    onSave({
      id: initial?.id ?? nanoid(),
      name: name.trim(),
      kind,
      category: category.trim() || 'Other',
      frequency: 'monthly',
      nextDueDate: start ?? initial?.nextDueDate ?? now,
      ...(start !== undefined ? { startDate: start } : {}),
      ...(end !== undefined ? { endDate: end } : {}),
      autoAdd,
      amountMode,
      fixedAmount: amountMode === 'fixed' ? amount : undefined,
      splitMethod: initial?.splitMethod ?? 'equal',
      sharedBy,
      status: initial?.status ?? 'active',
      skipNext: initial?.skipNext ?? false,
      includeInBudget,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    });
    onOpenChange(false);
  };

  const categoryOptions = category && !recurringCategories.some(option => option.value === category)
    ? [...recurringCategories, { value: category, key: 'sharedHomeCategoryOther' as TranslationKey }]
    : recurringCategories;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto bg-white">
        <DialogHeader><DialogTitle>{initial ? t('sharedHomeEditRule') : t('sharedHomeRecurringRules')}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="recurring-name">{t('sharedHomeName')} *</Label><Input id="recurring-name" value={name} onChange={event => setName(event.target.value)} placeholder={t('sharedHomeExpenseNamePlaceholder')} autoFocus /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>{t('sharedHomeType')}</Label><Select value={kind} onValueChange={value => setKind(value as HouseholdExpenseKind)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bill">{t('sharedHomeBills')}</SelectItem><SelectItem value="grocery">{t('sharedHomeGroceries')}</SelectItem><SelectItem value="expense">{t('sharedHomeExpenses')}</SelectItem><SelectItem value="rent">{t('sharedHomeRent')}</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>{t('sharedHomeCategory')}</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categoryOptions.map(option => <SelectItem key={option.value} value={option.value}>{t(option.key)}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>{t('sharedHomeMonthlyView')}</Label><Select value="monthly" disabled><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">{t('sharedHomeMonthlyView')}</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>{t('sharedHomeAmountMode')}</Label><Select value={amountMode} onValueChange={value => setAmountMode(value as 'fixed' | 'variable')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fixed">{t('sharedHomeFixedAmount')}</SelectItem><SelectItem value="variable">{t('sharedHomeVariableAmount')}</SelectItem></SelectContent></Select></div>
          {amountMode === 'fixed' && <div className="space-y-2"><Label htmlFor="recurring-amount">{t('amount')} *</Label><Input id="recurring-amount" type="number" min="0.01" step="0.01" value={fixedAmount} onChange={event => setFixedAmount(event.target.value)} placeholder={t('sharedHomeZeroAmountPlaceholder')} /></div>}
          <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="recurring-start">{t('sharedHomeStartDate')}</Label><Input id="recurring-start" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="recurring-end">{t('sharedHomeEndDate')}</Label><Input id="recurring-end" type="date" value={endDate} onChange={event => setEndDate(event.target.value)} /></div></div>
          <div className="space-y-2"><Label>{t('sharedHomeSharedBy')}</Label><div className="grid grid-cols-2 gap-2">{activeMembers.map(member => <label key={member.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><input type="checkbox" checked={sharedBy.includes(member.id)} onChange={() => setSharedBy(current => current.includes(member.id) ? current.filter(id => id !== member.id) : [...current, member.id])} />{member.name}</label>)}</div></div>
          <label className="flex items-start gap-2 rounded-xl border border-[#c7d8cc] bg-[#f2fbf3] px-3 py-3 text-sm"><input className="mt-0.5" type="checkbox" checked={includeInBudget} onChange={event => setIncludeInBudget(event.target.checked)} /><span><span className="block font-bold text-kharcha-navy">{t('sharedHomeIncludeInBudgetQuestion')}</span><span className="mt-1 block text-xs text-gray-600">{t('sharedHomeIncludeInBudgetHelp')}</span></span></label>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={autoAdd} onChange={event => setAutoAdd(event.target.checked)} />{t('sharedHomeAutoAddFixed')}</label>
          {error && <p className="text-sm font-semibold text-red-600" role="alert">{error}</p>}
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button><Button type="submit" className="bg-[#16834b] text-white hover:bg-[#11663b]">{t('sharedHomeSave')}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
