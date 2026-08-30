import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GroceryItem, HouseholdExpense, HouseholdExpenseKind, HouseholdSplitMethod, SharedHome } from '@/sharedHome/types';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/contexts/LanguageContext';
import { splitGroceryItems, splitHouseholdExpense, validateAllocations, validatePercentageSplit } from '@/sharedHome/calculations';
import { nanoid } from 'nanoid';

interface Props {
  open: boolean;
  kind: HouseholdExpenseKind;
  home: SharedHome;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: HouseholdExpense) => void;
}

interface GroceryDraft {
  id: string;
  name: string;
  amount: string;
  mode: 'common' | 'personal';
  personalMemberId: string;
}

const categories: Array<{ value: string; key: TranslationKey }> = [
  { value: 'Rent', key: 'sharedHomeRent' },
  { value: 'Food', key: 'sharedHomeCategoryFood' },
  { value: 'Groceries', key: 'sharedHomeGroceries' },
  { value: 'Electricity', key: 'sharedHomeCategoryElectricity' },
  { value: 'Water', key: 'sharedHomeCategoryWater' },
  { value: 'Gas', key: 'sharedHomeCategoryGas' },
  { value: 'Wi-Fi / Internet', key: 'sharedHomeCategoryInternet' },
  { value: 'Maintenance', key: 'sharedHomeCategoryMaintenance' },
  { value: 'Cleaning', key: 'sharedHomeCategoryCleaning' },
  { value: 'Household Supplies', key: 'sharedHomeCategorySupplies' },
  { value: 'Transport', key: 'pbTransport' as TranslationKey },
  { value: 'Other', key: 'sharedHomeCategoryOther' },
];

export default function SharedHomeExpenseDialog({ open, kind, home, onOpenChange, onSave }: Props) {
  const { t } = useLanguage();
  const activeMembers = useMemo(() => home.members.filter(member => member.isActive), [home.members]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(kind === 'grocery' ? 'Groceries' : kind === 'bill' ? 'Utilities' : 'Other');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paidBy, setPaidBy] = useState('');
  const [sharedBy, setSharedBy] = useState<string[]>([]);
  const [splitMethod, setSplitMethod] = useState<HouseholdSplitMethod>('equal');
  const [expenseScope, setExpenseScope] = useState<'shared' | 'personal'>('shared');
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [groceryItems, setGroceryItems] = useState<GroceryDraft[]>([]);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const defaultMember = home.managerMemberId || activeMembers[0]?.id || '';
    setName('');
    setAmount('');
    setPaidBy(defaultMember);
    setSharedBy(activeMembers.map(member => member.id));
    setSplitMethod('equal');
    setExpenseScope('shared');
    setCustomValues({});
    setPercentages({});
    setGroceryItems(kind === 'grocery' ? [{ id: nanoid(), name: '', amount: '', mode: 'common', personalMemberId: defaultMember }] : []);
    setReceiptUrl('');
    setError('');
    setDate(new Date().toISOString().slice(0, 10));
  }, [open, kind, home.managerMemberId, activeMembers]);

  const toggleMember = (memberId: string) => {
    setSharedBy(current => current.includes(memberId) ? current.filter(id => id !== memberId) : [...current, memberId]);
  };

  const groceryTotal = groceryItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const numericAmount = kind === 'grocery' ? groceryTotal : Number(amount);
    if (!name.trim() || !numericAmount || numericAmount <= 0 || !paidBy) {
      setError(t('sharedHomeInvalidExpense'));
      return;
    }
    if (kind === 'grocery' && (!groceryItems.length || groceryItems.some(item => !item.name.trim() || Number(item.amount) <= 0 || (item.mode === 'personal' && !item.personalMemberId)))) {
      setError(t('sharedHomeInvalidExpense'));
      return;
    }
    const custom = Object.fromEntries(sharedBy.map(id => [id, Number(customValues[id] || 0)]));
    const percentage = Object.fromEntries(sharedBy.map(id => [id, Number(percentages[id] || 0)]));
    if (kind !== 'grocery' && !sharedBy.length) {
      setError(t('sharedHomeInvalidExpense'));
      return;
    }
    if (kind !== 'grocery' && expenseScope === 'personal' && sharedBy.length !== 1) {
      setError(t('sharedHomeInvalidExpense'));
      return;
    }
    if (kind !== 'grocery' && splitMethod === 'custom' && !validateAllocations(numericAmount, custom).valid) {
      setError(t('sharedHomeCustomMustEqual'));
      return;
    }
    if (kind !== 'grocery' && splitMethod === 'percentage' && !validatePercentageSplit(percentage)) {
      setError(t('sharedHomePercentageMustEqual'));
      return;
    }

    const now = Date.now();
    let expenseSharedBy = sharedBy;
    let shares: Record<string, number> = {};
    let savedGroceryItems: GroceryItem[] | undefined;
    if (kind === 'grocery') {
      const items: GroceryItem[] = groceryItems.map(item => ({ id: item.id, name: item.name.trim(), amount: Number(item.amount), mode: item.mode, sharedBy: item.mode === 'common' ? activeMembers.map(member => member.id) : [item.personalMemberId], ...(item.mode === 'personal' ? { personalMemberId: item.personalMemberId } : {}) }));
      savedGroceryItems = items;
      const commonMembers = activeMembers.map(member => member.id);
      expenseSharedBy = commonMembers;
      shares = splitGroceryItems(items, commonMembers);
    } else {
      shares = splitHouseholdExpense(numericAmount, sharedBy, splitMethod === 'custom' ? 'custom' : splitMethod === 'percentage' ? 'percentage' : 'equal', { custom, percentages: percentage });
    }
    onSave({
      id: nanoid(),
      kind,
      name: name.trim(),
      category,
      amount: numericAmount,
      date: new Date(`${date}T12:00:00Z`).getTime(),
      paidBy,
      sharedBy: expenseSharedBy,
      splitMethod: kind === 'grocery' ? 'selected' : splitMethod,
      shares,
      groceryItems: savedGroceryItems,
      receiptUrl: receiptUrl.trim() || undefined,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    onOpenChange(false);
  };

  const updateGroceryItem = (id: string, patch: Partial<GroceryDraft>) => setGroceryItems(current => current.map(item => item.id === id ? { ...item, ...patch } : item));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto bg-white border-2 border-[#16834b] rounded-2xl">
        <DialogHeader><DialogTitle className="text-xl font-black text-kharcha-navy">{kind === 'grocery' ? t('sharedHomeAddGrocery') : kind === 'bill' ? t('sharedHomeAddBill') : t('sharedHomeAddExpense')}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="shared-expense-name">{t('sharedHomeName')} *</Label><Input id="shared-expense-name" value={name} onChange={event => setName(event.target.value)} placeholder={t('sharedHomeExpenseNamePlaceholder')} autoFocus /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="shared-expense-amount">{t('amount')} *</Label><Input id="shared-expense-amount" type="number" min="0.01" step="0.01" value={kind === 'grocery' ? groceryTotal.toFixed(2) : amount} onChange={event => kind !== 'grocery' && setAmount(event.target.value)} readOnly={kind === 'grocery'} placeholder={t('sharedHomeAmountPlaceholder')} /></div>
            <div className="space-y-2"><Label htmlFor="shared-expense-date">{t('sharedHomeDate')}</Label><Input id="shared-expense-date" type="date" value={date} onChange={event => setDate(event.target.value)} /></div>
          </div>
          {kind === 'grocery' && <div className="space-y-3 rounded-xl bg-[#fffaf3] p-3"><div className="flex items-center justify-between"><Label>{t('sharedHomeGroceryItems')}</Label><Button type="button" size="sm" variant="outline" onClick={() => setGroceryItems(current => [...current, { id: nanoid(), name: '', amount: '', mode: 'common', personalMemberId: activeMembers[0]?.id ?? '' }])}>{t('sharedHomeAddItem')}</Button></div>{groceryItems.map((item, index) => <div key={item.id} className="space-y-2 rounded-lg border bg-white p-2"><div className="grid grid-cols-[1fr_90px] gap-2"><Input aria-label={`${t('sharedHomeGroceryItem')} ${index + 1}`} value={item.name} onChange={event => updateGroceryItem(item.id, { name: event.target.value })} placeholder={t('sharedHomeGroceryItemPlaceholder')} /><Input aria-label={`${t('amount')} ${index + 1}`} type="number" min="0.01" step="0.01" value={item.amount} onChange={event => updateGroceryItem(item.id, { amount: event.target.value })} placeholder={t('sharedHomeZeroAmountPlaceholder')} /></div><div className="grid grid-cols-2 gap-2"><Select value={item.mode} onValueChange={value => updateGroceryItem(item.id, { mode: value as GroceryDraft['mode'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="common">{t('sharedHomeCommon')}</SelectItem><SelectItem value="personal">{t('sharedHomePersonal')}</SelectItem></SelectContent></Select>{item.mode === 'personal' && <Select value={item.personalMemberId} onValueChange={value => updateGroceryItem(item.id, { personalMemberId: value })}><SelectTrigger><SelectValue placeholder={t('sharedHomeChooseMember')} /></SelectTrigger><SelectContent>{activeMembers.map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}</SelectContent></Select>}</div>{groceryItems.length > 1 && <Button type="button" size="sm" variant="ghost" onClick={() => setGroceryItems(current => current.filter(entry => entry.id !== item.id))}>{t('delete')}</Button>}</div>)}</div>}
          <div className="space-y-2"><Label>{t('sharedHomeCategory')}</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map(option => <SelectItem key={option.value} value={option.value}>{t(option.key)}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="shared-expense-receipt">{t('sharedHomeReceipt')}</Label><Input id="shared-expense-receipt" type="url" value={receiptUrl} onChange={event => setReceiptUrl(event.target.value)} placeholder={t('sharedHomeReceiptOptional')} /></div>
          <div className="space-y-2"><Label>{t('sharedHomePaidBy')}</Label><Select value={paidBy} onValueChange={setPaidBy}><SelectTrigger><SelectValue placeholder={t('sharedHomeChoosePayer')} /></SelectTrigger><SelectContent>{activeMembers.map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}</SelectContent></Select></div>
          {kind !== 'grocery' && <><div className="space-y-2"><Label>{t('sharedHomeSharedBy')}</Label><Select value={expenseScope} onValueChange={value => { const next = value as 'shared' | 'personal'; setExpenseScope(next); setSharedBy(next === 'shared' ? activeMembers.map(member => member.id) : (paidBy ? [paidBy] : activeMembers.slice(0, 1).map(member => member.id))); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="shared">{t('sharedHomeCommon')}</SelectItem><SelectItem value="personal">{t('sharedHomePersonal')}</SelectItem></SelectContent></Select></div>{expenseScope === 'personal' ? <div className="space-y-2"><Label>{t('sharedHomeChooseMember')}</Label><Select value={sharedBy[0] ?? ''} onValueChange={value => setSharedBy([value])}><SelectTrigger><SelectValue placeholder={t('sharedHomeChooseMember')} /></SelectTrigger><SelectContent>{activeMembers.map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}</SelectContent></Select></div> : <div className="space-y-2"><Label>{t('sharedHomeSharedBy')}</Label><div className="grid grid-cols-2 gap-2">{activeMembers.map(member => <label key={member.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><input type="checkbox" checked={sharedBy.includes(member.id)} onChange={() => toggleMember(member.id)} />{member.name}</label>)}</div></div>}<div className="space-y-2"><Label>{t('sharedHomeSplitMethod')}</Label><Select value={splitMethod} onValueChange={value => setSplitMethod(value as HouseholdSplitMethod)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="equal">{t('sharedHomeEqual')}</SelectItem><SelectItem value="selected">{t('sharedHomeSelectedEqually')}</SelectItem><SelectItem value="custom">{t('sharedHomeCustomAmount')}</SelectItem><SelectItem value="percentage">{t('sharedHomePercentage')}</SelectItem></SelectContent></Select></div>{(splitMethod === 'custom' || splitMethod === 'percentage') && expenseScope === 'shared' && <div className="space-y-2 rounded-xl bg-[#fffaf3] p-3">{sharedBy.map(id => { const member = activeMembers.find(item => item.id === id); return <div key={id} className="grid grid-cols-[1fr_110px] items-center gap-2"><span className="text-sm font-semibold">{member?.name}</span><Input type="number" min="0" step="0.01" value={splitMethod === 'custom' ? (customValues[id] ?? '') : (percentages[id] ?? '')} onChange={event => splitMethod === 'custom' ? setCustomValues(current => ({ ...current, [id]: event.target.value })) : setPercentages(current => ({ ...current, [id]: event.target.value }))} placeholder={splitMethod === 'custom' ? t('sharedHomeZeroAmountPlaceholder') : t('sharedHomeZeroPercentagePlaceholder')} /></div>; })}</div>}</>}
          {error && <p className="text-sm font-semibold text-red-600" role="alert">{error}</p>}
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button><Button type="submit" className="bg-[#16834b] text-white hover:bg-[#11663b]">{t('sharedHomeSave')}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
