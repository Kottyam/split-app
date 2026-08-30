import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, PieChart, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
const money = (n: number, language: string) => new Intl.NumberFormat(language === 'en' ? 'en-IN' : `${language}-IN`, { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const reportCategoryKeys: Record<string, string> = { Food: 'pbFood', Groceries: 'pbGroceriesValue', Transport: 'pbTransport', Shopping: 'pbShopping', Entertainment: 'pbEntertainment', Utilities: 'pbUtilities', Housing: 'pbHousing', Health: 'pbHealth', Education: 'pbEducation', Other: 'pbOther', Rent: 'pbRent', Maintenance: 'pbMaintenance', Electricity: 'pbElectricity', Water: 'pbWater', Gas: 'pbGas', Internet: 'pbInternet', Restaurant: 'pbRestaurant', 'Food Delivery': 'pbFoodDelivery', Fuel: 'pbFuel', Taxi: 'pbTaxi', Bus: 'pbBus', Train: 'pbTrain', Parking: 'pbParking', Toll: 'pbToll', Doctor: 'pbDoctor', Medicine: 'pbMedicine', Hospital: 'pbHospital', School: 'pbSchool', Tuition: 'pbTuition', Books: 'pbBooks', Family: 'pbFamily', Children: 'pbChildren', Parents: 'pbParents', Household: 'pbHousehold', Gym: 'pbGym', Subscription: 'pbSubscription', Financial: 'pbFinancial', EMI: 'pbEmi', Insurance: 'pbInsurance', Miscellaneous: 'pbMiscellaneous' };
const reportCategoryLabel = (t: (key: any) => string, category: string) => reportCategoryKeys[category] ? t(reportCategoryKeys[category]) : category;

interface Props {
  t: (key: any) => string;
  profile: any;
  selectedMonth: string;
  language: string;
}

export default function ReportsAnalyticsView({ t, profile, selectedMonth, language }: Props) {
  const [range, setRange] = useState<string>('this_month');

  // Filter transactions based on date range
  const filteredTransactions = useMemo(() => {
    const expenses = profile.expenseTransactions || [];
    const incomes = profile.incomeTransactions || [];
    if (range === 'this_month') {
      return {
        expenses: expenses.filter((item: any) => item.date?.startsWith(selectedMonth)),
        incomes: incomes.filter((item: any) => item.date?.startsWith(selectedMonth)),
      };
    }
    // Default fallback to all or recent
    return { expenses, incomes };
  }, [profile, selectedMonth, range]);

  const totalIncome = useMemo(() => {
    return filteredTransactions.incomes.reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions.expenses
      .filter((e: any) => e.status === 'Paid' && e.includeInBudget !== false)
      .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
  }, [filteredTransactions]);

  const savings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filteredTransactions.expenses
      .filter((e: any) => e.status === 'Paid' && e.includeInBudget !== false)
      .forEach((e: any) => {
        const cat = e.category || 'Other';
        map.set(cat, (map.get(cat) || 0) + (Number(e.amount) || 0));
      });
    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, totalExpense]);

  // Budget performance comparison
  const budgets = profile.budgets || [];
  const currentMonthBudgets = budgets.filter((b: any) => b.month === selectedMonth);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-kharcha-navy">{t('reportsAnalytics')}</h2>
          <p className="text-xs font-bold text-gray-600">{t('reportsSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-[#16834b]" />
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[160px] border-2 border-black rounded-xl font-bold bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-2 border-black font-bold">
              <SelectItem value="this_month">{t('thisMonth')}</SelectItem>
              <SelectItem value="all">{t('allRecords')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Monthly Summary Card */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="rounded-2xl border-2 border-black bg-[#dff1e5] p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#16834b]">{t('totalIncome')}</p>
          <p className="mt-1 text-2xl font-black text-kharcha-navy">{money(totalIncome, language)}</p>
          <div className="mt-2 flex items-center text-xs font-bold text-[#16834b]"><ArrowUpRight size={14} className="mr-1" />{t('verifiedInflow')}</div>
        </Card>
        <Card className="rounded-2xl border-2 border-black bg-[#fff3e3] p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#c45a00]">{t('totalExpenses')}</p>
          <p className="mt-1 text-2xl font-black text-kharcha-navy">{money(totalExpense, language)}</p>
          <div className="mt-2 flex items-center text-xs font-bold text-[#c45a00]"><ArrowDownRight size={14} className="mr-1" />{t('paidActive')}</div>
        </Card>
        <Card className="rounded-2xl border-2 border-black bg-[#e4efff] p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#2563eb]">{t('netSavings')}</p>
          <p className="mt-1 text-2xl font-black text-kharcha-navy">{money(savings, language)}</p>
          <div className="mt-2 flex items-center text-xs font-bold text-[#2563eb]">{t('incomeMinusExpense')}</div>
        </Card>
        <Card className="rounded-2xl border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">{t('savingsRate')}</p>
          <p className="mt-1 text-2xl font-black text-kharcha-navy">{savingsRate}%</p>
          <div className="mt-2 text-xs font-bold text-gray-500">{savings >= 0 ? t('healthySurplus') : t('deficit')}</div>
        </Card>
      </div>

      {/* Expense by Category */}
      <Card className="rounded-2xl border-2 border-black bg-white p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-lg font-black text-kharcha-navy flex items-center gap-2">
          <PieChart size={18} className="text-[#e87817]" /> {t('expenseBreakdown')}
        </h3>
        {categoryBreakdown.length === 0 ? (
          <p className="mt-3 text-sm font-bold text-gray-500">{t('noExpenseRecords')}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {categoryBreakdown.map((item: any) => (
              <div key={item.category} className="space-y-1">
                <div className="flex justify-between text-xs font-black">
                  <span>{reportCategoryLabel(t, item.category)}</span>
                  <span>{money(item.amount, language)} ({item.percentage}%)</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full border border-black bg-gray-100">
                  <div className="h-full bg-[#16834b]" style={{ width: `${Math.min(100, item.percentage)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Budget Performance */}
      <Card className="rounded-2xl border-2 border-black bg-white p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-lg font-black text-kharcha-navy flex items-center gap-2">
          <BarChart3 size={18} className="text-[#2563eb]" /> {t('budgetLimitsPerformance')}
        </h3>
        {currentMonthBudgets.length === 0 ? (
          <p className="mt-3 text-sm font-bold text-gray-500">{t('noCategoryBudgets')}</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {currentMonthBudgets.map((b: any) => {
              const spent = filteredTransactions.expenses
                .filter((e: any) => e.status === 'Paid' && e.category === b.category)
                .reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
              const pct = Math.round((spent / b.plannedAmount) * 100);
              const exceeded = spent > b.plannedAmount;
              return (
                <div key={b.id} className="rounded-xl border-2 border-black bg-gray-50 p-3">
                  <div className="flex justify-between font-black text-sm">
                    <span>{reportCategoryLabel(t, b.category)}</span>
                    <span className={exceeded ? 'text-red-600' : 'text-[#16834b]'}>{pct}% {t('auditUsed' as any)}</span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-gray-600">
                    {t('auditSpent' as any)}: {money(spent, language)} / {t('auditLimit' as any)}: {money(b.plannedAmount, language)}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full border border-black bg-gray-200">
                    <div className={`h-full ${exceeded ? 'bg-red-500' : 'bg-[#16834b]'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
