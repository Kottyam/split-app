import { Trip, TripSummary } from '@/types';
import { Card } from '@/components/ui/card';
import { getCategoryInfo } from '@/lib/categories';
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardViewProps {
  trip: Trip;
  summary: TripSummary;
}

function tripCategoryLabel(t: (key: any, variables?: any) => string, category: string) {
  const keys: Record<string, string> = { food: 'auditTripFood', transport: 'auditTripTransport', hotel: 'auditTripHotel', shopping: 'auditTripShopping', entertainment: 'auditTripEntertainment', others: 'auditTripOthers' };
  return t(keys[category] || 'auditUnknown');
}

export default function DashboardView({ trip, summary }: DashboardViewProps) {
  const { t } = useLanguage();
  const memberMap = new Map(trip.members.map(m => [m.id, m.name]));

  // Sort categories by spending
  const categorySpending = Object.entries(summary.categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .filter(([, amount]) => amount > 0);

  // Sort members by spending
  const memberSpending = Object.entries(summary.memberSpend)
    .map(([memberId, amount]) => ({
      memberId,
      name: memberMap.get(memberId) || t('auditUnknown' as any),
      spent: amount,
      owed: summary.memberOwes[memberId] || 0,
    }))
    .sort((a, b) => b.spent - a.spent);

  const maxSpending = Math.max(...memberSpending.map(m => m.spent), 1);

  return (
    <div className="space-y-4">
      {/* Category Breakdown */}
      <div>
        <h3 className="font-black text-black text-lg mb-3">{t('auditSpendingByCategory' as any)}</h3>
        {categorySpending.length === 0 ? (
          <Card className="bg-white border-2 border-black rounded-lg p-6 text-center">
            <p className="text-gray-600 font-semibold">{t('auditNoExpensesYet' as any)}</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {categorySpending.map(([category, amount]) => {
              const categoryInfo = getCategoryInfo(category as any);
              const Icon = categoryInfo.icon;
              const percentage = (amount / summary.totalExpenses) * 100;

              return (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-1">
                    <div className={`${categoryInfo.bgColor} rounded-lg p-1.5 flex-shrink-0`}>
                      <Icon className={`${categoryInfo.color}`} size={16} />
                    </div>
                    <span className="font-bold text-black flex-1">{tripCategoryLabel(t, category)}</span>
                    <span className="font-bold text-black">{formatCurrencyCompact(amount)}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Spending */}
      <div>
        <h3 className="font-black text-black text-lg mb-3">{t('auditSpendingByMember' as any)}</h3>
        {memberSpending.length === 0 ? (
          <Card className="bg-white border-2 border-black rounded-lg p-6 text-center">
            <p className="text-gray-600 font-semibold">{t('auditNoMembersYet' as any)}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {memberSpending.map(member => {
              const percentage = (member.spent / maxSpending) * 100;
              const balance = member.spent - member.owed;

              return (
                <Card key={member.memberId} className="bg-white border-2 border-black rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-black">{member.name}</span>
                    <span className="font-black text-black text-lg">
                      {formatCurrencyCompact(member.spent)}
                    </span>
                  </div>

                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-black transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs font-semibold text-gray-600">
                    <span>{t('auditPaidAmount' as any)} {formatCurrencyCompact(member.spent)}</span>
                    <span>{t('auditOwesAmount' as any)} {formatCurrencyCompact(member.owed)}</span>
                    <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {balance >= 0 ? '+' : ''}{formatCurrencyCompact(balance)}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Statistics */}
      <Card className="bg-white border-2 border-black rounded-lg p-4">
        <h3 className="font-black text-black mb-3">{t('auditTripStatistics' as any)}</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-600 font-semibold">{t('auditTotalExpensesLabel' as any)}</p>
            <p className="font-black text-black text-lg mt-1">
              {formatCurrencyCompact(summary.totalExpenses)}
            </p>
          </div>
          <div>
            <p className="text-gray-600 font-semibold">{t('auditPerPersonAvg' as any)}</p>
            <p className="font-black text-black text-lg mt-1">
              {formatCurrencyCompact(summary.totalExpenses / Math.max(trip.members.length, 1))}
            </p>
          </div>
          <div>
            <p className="text-gray-600 font-semibold">{t('auditTotalExpensesLabel' as any)}</p>
            <p className="font-black text-black text-lg mt-1">{trip.expenses.length}</p>
          </div>
          <div>
            <p className="text-gray-600 font-semibold">{t('auditMembers' as any)}</p>
            <p className="font-black text-black text-lg mt-1">{trip.members.length}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
