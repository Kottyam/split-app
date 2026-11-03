import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { computeBudgetStatus } from '@/groupFund/budget';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function Bar({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-black text-kharcha-navy"><span>{label}</span><span>{inr(value)}</span></div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/** Budget vs Collected vs Expenses. Renders nothing when the fund has no budget. */
export default function FundBudgetCard({ budget, collected, expenses }: { budget?: number; collected: number; expenses: number }) {
  const { t } = useLanguage();
  const s = computeBudgetStatus(budget, collected, expenses);
  if (!s) return null;
  const status = s.state === 'over'
    ? { cls: 'bg-red-50 text-red-700 border-red-200', text: `${t('auditBudgetOver' as any)} ${inr(s.overBy)}` }
    : s.state === 'collection-short'
      ? { cls: 'bg-amber-50 text-amber-800 border-amber-200', text: `${t('auditBudgetCollectionShort' as any)} ${inr(s.collectionShortBy)}` }
      : { cls: 'bg-green-50 text-green-700 border-green-200', text: t('auditBudgetWithin' as any) };
  return (
    <Card className="rounded-2xl border border-kharcha-line bg-white p-5 shadow-sm" data-testid="fund-budget-card" data-state={s.state}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-kharcha-navy">{t('auditBudget' as any)}</p>
          <h3 className="mt-1 text-2xl font-black text-[#023b81]">{inr(s.budget)}</h3>
        </div>
        <div className="text-right">
          <p className="text-xs font-black uppercase tracking-wider text-kharcha-navy">{t('auditBudgetRemaining' as any)}</p>
          <p className={`mt-1 text-lg font-black ${s.remaining >= 0 ? 'text-[#16834b]' : 'text-red-600'}`}>{inr(s.remaining)}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <Bar label={t('auditTotalCollected' as any)} value={s.collected} pct={s.collectedPct} color="#038f27" />
        <Bar label={t('auditTotalExpenses' as any)} value={s.expenses} pct={s.spentPct} color={s.state === 'over' ? '#dc2626' : '#fd6d00'} />
      </div>
      <p className={`mt-4 rounded-xl border px-3 py-2 text-sm font-black ${status.cls}`}>{status.text}</p>
    </Card>
  );
}
