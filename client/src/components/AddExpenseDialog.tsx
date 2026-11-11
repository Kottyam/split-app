import { showFieldError } from '@/lib/formValidation';
import { toLocalDateKey } from '@/lib/localDate';
import { useState, useMemo } from 'react';
import { getCustomSplitStatus, formatSplitAmount } from '@/lib/customSplit';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trip, ExpenseCategory } from '@/types';
import { useTrips } from '@/hooks/useTrips';
import { getAllCategories, getCategoryInfo } from '@/lib/categories';
import { toast } from 'sonner';

function tripCategoryLabel(t: (key: any, variables?: any) => string, category: ExpenseCategory) {
  const keys: Record<ExpenseCategory, string> = { food: 'auditTripFood', transport: 'auditTripTransport', hotel: 'auditTripHotel', shopping: 'auditTripShopping', entertainment: 'auditTripEntertainment', others: 'auditTripOthers' };
  return t(keys[category]);
}

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip;
}

export default function AddExpenseDialog({
  open,
  onOpenChange,
  trip,
}: AddExpenseDialogProps) {
  const [description, setDescription] = useState('');
  const [remark, setRemark] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [paidBy, setPaidBy] = useState(trip.members[0]?.id || '');
  const [date, setDate] = useState(toLocalDateKey(new Date()));
  const [splitType, setSplitType] = useState<'equal-all' | 'equal-selected' | 'custom'>('equal-all');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(trip.members.map(m => m.id))
  );

  const handleSplitTypeChange = (nextType: 'equal-all' | 'equal-selected' | 'custom') => {
    setSplitType(nextType);
    if (nextType === 'equal-all') {
      setSelectedMembers(new Set(trip.members.map(m => m.id)));
    }
  };
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [splitError, setSplitError] = useState('');
  const { addExpense } = useTrips();
  const { t } = useLanguage();

  const categories = useMemo(() => getAllCategories(), []);

  const toggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeMembers = splitType === 'equal-all' ? new Set(trip.members.map(member => member.id)) : selectedMembers;
    if (!description.trim()) { showFieldError('description', t('auditErrExpenseDescription' as any)); return; }
    const expenseAmount = parseFloat(amount);
    if (!amount.trim() || !Number.isFinite(expenseAmount) || expenseAmount <= 0) { showFieldError('amount', t('auditErrExpenseAmount' as any)); return; }
    if (!paidBy) { showFieldError('expense-paid-by', t('auditErrPaidBy' as any)); return; }
    if (activeMembers.size === 0) { showFieldError('expense-split-members', t('auditErrSplitMembers' as any)); return; }
    let splits: Record<string, number> = {};

    if (splitType === 'equal-all' || splitType === 'equal-selected') {
      const activeMembers = splitType === 'equal-all' ? new Set(trip.members.map(m => m.id)) : selectedMembers;
      if (activeMembers.size === 0) {
        toast.error(t('auditChooseSplitMember' as any));
        return;
      }
      const perPerson = expenseAmount / activeMembers.size;
      activeMembers.forEach(memberId => {
        splits[memberId] = perPerson;
      });
    } else {
      // Custom split
      let totalCustom = 0;
      selectedMembers.forEach(memberId => {
        const customAmount = parseFloat(customSplits[memberId] || '0');
        splits[memberId] = customAmount;
        totalCustom += customAmount;
      });

      const splitStatus = getCustomSplitStatus(expenseAmount, Array.from(selectedMembers).map(id => customSplits[id]));
      if (!splitStatus.matches) {
        const message = t('tripSplitMismatch' as any, { split: formatSplitAmount(splitStatus.splitTotal), total: formatSplitAmount(splitStatus.expenseTotal), diff: formatSplitAmount(splitStatus.difference) });
        setSplitError(message);
        toast.error(message);
        return;
      }
      setSplitError('');
    }

    addExpense(
      trip.id,
      description,
      expenseAmount,
      category,
      paidBy,
      new Date(date).getTime(),
      splits,
      remark
    );

    // Reset form
    setDescription('');
    setRemark('');
    setAmount('');
    setCategory('food');
    setPaidBy(trip.members[0]?.id || '');
    setDate(toLocalDateKey(new Date()));
    setSplitType('equal-all');
    setSelectedMembers(new Set(trip.members.map(m => m.id)));
    setCustomSplits({});
    onOpenChange(false);
  };

  if (trip.members.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-white border-2 border-black rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-black">{t('addExpense')}</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 font-semibold">{t('pleaseAddMembers')}</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-2 border-black rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-black text-black text-xl">{t('addExpense')}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('recordExpense')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <Label htmlFor="description" className="font-bold text-black">
              {t('description')}
            </Label>
            <Input
              id="description"
              placeholder={t('auditItemPlaceholder' as any)}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-2 border-black rounded-lg mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="expense-remark" className="font-bold text-black">{t('remarkOptional' as any)}</Label>
            <Input id="expense-remark" value={remark} maxLength={300} onChange={(e) => setRemark(e.target.value)} placeholder={t('expenseRemarkPlaceholder' as any)} className="border-2 border-black rounded-lg mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount" className="font-bold text-black">
                {t('amount')}
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border-2 border-black rounded-lg mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="category" className="font-bold text-black">
                {t('category')}
              </Label>
              <Select value={category} onValueChange={(val) => setCategory(val as ExpenseCategory)}>
                <SelectTrigger className="border-2 border-black rounded-lg mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-black">
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {tripCategoryLabel(t, cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paid-by" className="font-bold text-black">
                {t('paidBy')}
              </Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger id="expense-paid-by" className="border-2 border-black rounded-lg mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-black">
                  {trip.members.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date" className="font-bold text-black">
                {t('date')}
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-2 border-black rounded-lg mt-1"
                required
              />
            </div>
          </div>

          <div>
            <Label className="font-bold text-black mb-2 block">{t('auditSplitType' as any)}</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={splitType === 'equal-all'}
                  onChange={() => handleSplitTypeChange('equal-all')}
                  className="w-4 h-4 accent-[#16834b]"
                />
                <span className="font-semibold text-black">{t('auditEqualAll' as any)}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={splitType === 'equal-selected'}
                  onChange={() => handleSplitTypeChange('equal-selected')}
                  className="w-4 h-4 accent-[#16834b]"
                />
                <span className="font-semibold text-black">{t('auditEqualSelected' as any)}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={splitType === 'custom'}
                  onChange={() => handleSplitTypeChange('custom')}
                  className="w-4 h-4 accent-[#16834b]"
                />
                <span className="font-semibold text-black">{t('auditCustomSplitMode' as any)}</span>
              </label>
            </div>
          </div>

          <div>
            <Label className="font-bold text-black mb-2 block">
              {splitType === 'equal-all' ? t('auditAllMembersIncluded' as any) : splitType === 'equal-selected' ? t('auditSelectPeople' as any) : t('auditCustomAmountsHint' as any)}
            </Label>
            <div id="expense-split-members" tabIndex={-1} className="space-y-2 max-h-40 overflow-y-auto rounded-lg">
              {trip.members.map(member => (
                <div key={member.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`member-${member.id}`}
                    checked={splitType === 'equal-all' ? true : selectedMembers.has(member.id)}
                    disabled={splitType === 'equal-all'}
                    onCheckedChange={() => toggleMember(member.id)}
                  />
                  <label
                    htmlFor={`member-${member.id}`}
                    className="font-semibold text-black cursor-pointer flex-1"
                  >
                    {member.name}
                  </label>
                  {splitType === 'custom' && selectedMembers.has(member.id) && (
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={customSplits[member.id] || ''}
                      onChange={(e) =>
                        setCustomSplits({
                          ...customSplits,
                          [member.id]: e.target.value,
                        })
                      }
                      className="border-2 border-black rounded-lg w-20"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {splitType === 'custom' && (() => {
            const live = getCustomSplitStatus(parseFloat(amount), Array.from(selectedMembers).map(id => customSplits[id]));
            const text = live.matches ? t('tripSplitMatched' as any) : live.difference > 0 ? t('tripSplitRemaining' as any, { amount: formatSplitAmount(live.difference) }) : t('tripSplitOver' as any, { amount: formatSplitAmount(live.difference) });
            return (
              <div data-testid="custom-split-status" role={splitError ? 'alert' : 'status'} className={`rounded-xl border px-3 py-2 text-sm font-bold ${live.matches ? 'border-[#16834b]/40 bg-[#e6f3e8] text-[#16834b]' : 'border-red-300 bg-red-50 text-red-700'}`}>
                <p>{t('tripSplitTotals' as any, { split: formatSplitAmount(live.splitTotal), total: formatSplitAmount(live.expenseTotal) })} · {text}</p>
                {splitError && !live.matches && <p className="mt-1 font-semibold">{splitError}</p>}
              </div>
            );
          })()}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-2 border-black font-bold rounded-lg"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-black text-white font-bold rounded-lg hover:bg-gray-800"
            >
              {t('addExpense')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
