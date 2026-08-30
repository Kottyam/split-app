import { useState, useEffect, useMemo } from 'react';
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
import { Trip, Expense, ExpenseCategory } from '@/types';
import { useTrips } from '@/hooks/useTrips';
import { getAllCategories, getCategoryInfo } from '@/lib/categories';
import { useLanguage } from '@/contexts/LanguageContext';

function tripCategoryLabel(t: (key: any, variables?: any) => string, category: ExpenseCategory) {
  const keys: Record<ExpenseCategory, string> = { food: 'auditTripFood', transport: 'auditTripTransport', hotel: 'auditTripHotel', shopping: 'auditTripShopping', entertainment: 'auditTripEntertainment', others: 'auditTripOthers' };
  return t(keys[category]);
}

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip;
  expense: Expense | null;
}

export default function EditExpenseDialog({
  open,
  onOpenChange,
  trip,
  expense,
}: EditExpenseDialogProps) {
  const { t } = useLanguage();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [paidBy, setPaidBy] = useState('');
  const [date, setDate] = useState('');
  const [splitType, setSplitType] = useState<'equal-all' | 'equal-selected' | 'custom'>('equal-all');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  const handleSplitTypeChange = (nextType: 'equal-all' | 'equal-selected' | 'custom') => {
    setSplitType(nextType);
    if (nextType === 'equal-all' && expense) {
      setSelectedMembers(new Set(trip.members.map(m => m.id)));
    }
  };
  const { updateExpense } = useTrips();

  const categories = useMemo(() => getAllCategories(), []);

  // Initialize form when expense changes
  useEffect(() => {
    if (expense) {
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setPaidBy(expense.paidBy);
      setDate(new Date(expense.date).toISOString().split('T')[0]);
      setSelectedMembers(new Set(Object.keys(expense.splits)));
      
      // Determine split mode
      const allMemberIds = new Set(trip.members.map(m => m.id));
      const splitMemberIds = Object.keys(expense.splits);
      const isAllMembers = splitMemberIds.length === allMemberIds.size && splitMemberIds.every(id => allMemberIds.has(id));
      const perPerson = expense.amount / splitMemberIds.length;
      const isEqualSplit = Object.values(expense.splits).every(
        amount => Math.abs(amount - perPerson) < 0.01
      );
      if (isEqualSplit && isAllMembers) {
        setSplitType('equal-all');
      } else if (isEqualSplit) {
        setSplitType('equal-selected');
      } else {
        setSplitType('custom');
      }
      
      // Set custom splits
      const splits: Record<string, string> = {};
      Object.entries(expense.splits).forEach(([memberId, amount]) => {
        splits[memberId] = amount.toString();
      });
      setCustomSplits(splits);
    }
  }, [expense, open]);

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
    if (!expense || !description || !amount || !paidBy || selectedMembers.size === 0) {
      alert(t('auditRequiredFields' as any));
      return;
    }

    const expenseAmount = parseFloat(amount);
    let splits: Record<string, number> = {};

    if (splitType === 'equal-all' || splitType === 'equal-selected') {
      const activeMembers = splitType === 'equal-all' ? new Set(trip.members.map(m => m.id)) : selectedMembers;
      if (activeMembers.size === 0) {
        alert(t('auditChooseSplitMember' as any) !== 'auditChooseSplitMember' ? t('auditChooseSplitMember' as any) : 'Please select at least one member.');
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

      if (Math.abs(totalCustom - expenseAmount) > 0.01) {
        alert(t('auditCustomSplitRequired' as any, { amount: expenseAmount }));
        return;
      }
    }

    updateExpense(trip.id, expense.id, {
      description,
      amount: expenseAmount,
      category,
      paidBy,
      date: new Date(date).getTime(),
      splits,
    });

    onOpenChange(false);
  };

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-2 border-black rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-black text-black text-xl">{t('auditEditExpense' as any)}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('auditUpdateExpenseDetails' as any)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description" className="font-bold text-black">
              {t('auditDescription' as any)}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount" className="font-bold text-black">
                {t('auditAmountRupees' as any)}
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
                {t('auditCategory' as any)}
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
                {t('auditPaidBy' as any)}
              </Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger className="border-2 border-black rounded-lg mt-1">
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
                {t('auditDate' as any)}
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
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {trip.members.map(member => (
                <div key={member.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`edit-member-${member.id}`}
                    checked={splitType === 'equal-all' ? true : selectedMembers.has(member.id)}
                    disabled={splitType === 'equal-all'}
                    onCheckedChange={() => toggleMember(member.id)}
                  />
                  <label
                    htmlFor={`edit-member-${member.id}`}
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

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-2 border-black font-bold rounded-lg"
            >
              {t('auditCancel' as any)}
            </Button>
            <Button
              type="submit"
              className="bg-black text-white font-bold rounded-lg hover:bg-gray-800"
            >
              {t('auditSaveChanges' as any)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
