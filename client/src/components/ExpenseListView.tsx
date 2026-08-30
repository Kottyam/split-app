import { useState, useMemo } from 'react';
import { Trip, Expense } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, ArrowUpDown } from 'lucide-react';
import { getCategoryInfo } from '@/lib/categories';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useTrips } from '@/hooks/useTrips';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeleteConfirmation } from '@/contexts/DeleteConfirmationContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExpenseListViewProps {
  trip: Trip;
  onEditExpense?: (expense: Expense) => void;
  onExpenseDeleted?: () => void;
}

type SortOption = 'date-newest' | 'date-oldest' | 'amount-highest' | 'amount-lowest' | 'name-a-z' | 'paid-by';

function tripCategoryLabel(t: (key: any, variables?: any) => string, category: Expense['category']) {
  const keys: Record<Expense['category'], string> = { food: 'auditTripFood', transport: 'auditTripTransport', hotel: 'auditTripHotel', shopping: 'auditTripShopping', entertainment: 'auditTripEntertainment', others: 'auditTripOthers' };
  return t(keys[category]);
}

function formatExpenseDate(value: number, language: string): string {
  return new Date(value).toLocaleDateString(language === 'en' ? 'en-IN' : `${language}-IN`);
}

export default function ExpenseListView({ trip, onEditExpense, onExpenseDeleted }: ExpenseListViewProps) {
  const { t, language } = useLanguage();
  const { removeExpense } = useTrips();
  const { requestDelete } = useDeleteConfirmation();
  const memberMap = new Map(trip.members.map(m => [m.id, m.name]));
  const [sortBy, setSortBy] = useState<SortOption>('date-newest');
  const [filterByPaidBy, setFilterByPaidBy] = useState<string | null>(null);

  const sortedExpenses = useMemo(() => {
    let sorted = [...trip.expenses];

    switch (sortBy) {
      case 'date-newest':
        sorted.sort((a, b) => b.date - a.date);
        break;
      case 'date-oldest':
        sorted.sort((a, b) => a.date - b.date);
        break;
      case 'amount-highest':
        sorted.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-lowest':
        sorted.sort((a, b) => a.amount - b.amount);
        break;
      case 'name-a-z':
        sorted.sort((a, b) => a.description.localeCompare(b.description));
        break;
      case 'paid-by':
        sorted.sort((a, b) => {
          const nameA = memberMap.get(a.paidBy) || '';
          const nameB = memberMap.get(b.paidBy) || '';
          return nameA.localeCompare(nameB);
        });
        break;
    }

    // Apply filter if paid-by filter is active
    if (filterByPaidBy) {
      sorted = sorted.filter(exp => exp.paidBy === filterByPaidBy);
    }

    return sorted;
  }, [trip.expenses, sortBy, filterByPaidBy]);

  if (trip.expenses.length === 0) {
    return (
      <Card className="bg-white border-2 border-black rounded-lg p-8 text-center">
        <p className="text-gray-600 font-semibold">{t('auditNoExpensesYet' as any)}</p>
        <p className="text-xs text-gray-500 mt-2">{t('auditAddExpenseStarted' as any)}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <ArrowUpDown size={16} className="text-gray-600" />
        <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
          <SelectTrigger className="border-2 border-black rounded-lg flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-2 border-black">
            <SelectItem value="date-newest">{t('auditNewestFirst' as any)}</SelectItem>
            <SelectItem value="date-oldest">{t('auditOldestFirst' as any)}</SelectItem>
            <SelectItem value="amount-highest">{t('auditHighestAmount' as any)}</SelectItem>
            <SelectItem value="amount-lowest">{t('auditLowestAmount' as any)}</SelectItem>
            <SelectItem value="name-a-z">{t('auditNameAZ' as any)}</SelectItem>
            <SelectItem value="paid-by">{t('auditPaidByPerson' as any)}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Paid By Filter - Show when sort is set to paid-by */}
      {sortBy === 'paid-by' && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-600">{t('auditFilterBy' as any)}</span>
          <Select value={filterByPaidBy || 'all'} onValueChange={(val) => setFilterByPaidBy(val === 'all' ? null : val)}>
            <SelectTrigger className="border-2 border-black rounded-lg flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-2 border-black">
              <SelectItem value="all">{t('auditAllMembers' as any)}</SelectItem>
              {trip.members.map(member => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Paid By Filter Total */}
      {sortBy === 'paid-by' && filterByPaidBy && (
        <Card className="bg-white border-2 border-blue-300 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-700">
              {t('auditTotalPaidBy' as any, { name: memberMap.get(filterByPaidBy) || t('auditUnknown' as any) })}
            </span>
            <span className="font-black text-lg text-blue-600">
              {formatCurrency(sortedExpenses.reduce((sum, exp) => sum + exp.amount, 0))}
            </span>
          </div>
        </Card>
      )}

      {/* Expense List */}
      <div className="space-y-3">
        {sortedExpenses.map(expense => {
          const categoryInfo = getCategoryInfo(expense.category);
          const Icon = categoryInfo.icon;
          const paidByName = memberMap.get(expense.paidBy) || t('auditUnknown' as any);

          return (
            <Card key={expense.id} className="bg-white border-2 border-black rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className={`${categoryInfo.bgColor} rounded-lg p-2 flex-shrink-0`}>
                  <Icon className={`${categoryInfo.color}`} size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-bold text-black">{expense.description}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {t('auditPaidBy' as any)} <span className="font-semibold">{paidByName}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{formatExpenseDate(expense.date, language)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-black text-lg">{formatCurrency(expense.amount)}</p>
                      <p className="text-xs text-gray-600 font-semibold mt-1">
                        {tripCategoryLabel(t, expense.category)}
                      </p>
                    </div>
                  </div>

                  {/* Split details */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-bold text-gray-700 mb-2">{t('auditSplitLabel' as any)}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(expense.splits).map(([memberId, amount]) => (
                        <div key={memberId} className="text-xs">
                          <span className="font-semibold text-black">
                            {memberMap.get(memberId)}:
                          </span>
                          <span className="text-gray-600 ml-1">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditExpense?.(expense)}
                      className="text-blue-600 hover:bg-blue-50 flex-1"
                    >
                      <Edit2 size={16} className="mr-1" />
                      {t('auditEdit' as any)}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => requestDelete({ title: t('auditDeleteExpenseConfirmShort' as any, { name: expense.description }), message: t('auditActionCannotUndo' as any), onConfirm: () => { removeExpense(trip.id, expense.id); onExpenseDeleted?.(); } })}
                      className="text-red-600 hover:bg-red-50 flex-1"
                    >
                      <Trash2 size={16} className="mr-1" />
                      {t('auditDelete' as any)}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
