import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatBudgetPercentage, type BudgetSummary } from './types';

interface HistoryItem {
  label: string;
  summary: BudgetSummary;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodLabel: string;
  summary: BudgetSummary;
  history?: HistoryItem[];
}

function money(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function BudgetDetailsDialog({ open, onOpenChange, periodLabel, summary, history = [] }: Props) {
  const { t } = useLanguage();
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border-2 border-[#16834b] bg-white"><DialogHeader><DialogTitle className="flex items-center gap-2 text-xl font-black text-kharcha-navy"><Wallet className="text-[#e87817]" size={22} />{t('budgetDetails')} · {periodLabel}</DialogTitle></DialogHeader>{!summary.configured ? <div className="rounded-xl bg-[#fffaf3] p-4"><h3 className="font-black text-kharcha-navy">{t('budgetNoBudget')}</h3><p className="mt-1 text-sm text-gray-600">{t('budgetSetDescription')}</p></div> : <div className="space-y-4"><div className={`grid grid-cols-2 gap-3 ${summary.excludedSpent > 0 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}><Metric label={t('budgetTotal')} value={money(summary.budget)} /><Metric label={summary.excludedSpent > 0 ? t('budgetTrackedSpending') : t('budgetSpent')} value={money(summary.spent)} accent="orange" />{summary.excludedSpent > 0 && <Metric label={t('budgetActualSpending')} value={money(summary.actualSpent)} /> }<Metric label={t('budgetRemaining')} value={money(summary.remaining)} accent="green" /><Metric label={t('budgetUsed')} value={formatBudgetPercentage(summary.percentageUsed)} /></div>{summary.excludedSpent > 0 && <p className="rounded-xl border border-[#e7d7bd] bg-[#fffaf3] px-3 py-2 text-xs font-semibold text-gray-600">{t('budgetExcludedExplanation', { amount: money(summary.excludedSpent) })}</p>}{summary.status === 'exceeded' && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{t('budgetExceeded')}: {money(summary.overBudget)}</div>}{summary.status === 'near-limit' && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700">{t('budgetNearLimit')}: {formatBudgetPercentage(summary.percentageUsed)} {t('budgetUsed').toLowerCase()}</div>}<div><div className="mb-1 flex justify-between text-xs font-bold text-gray-500"><span>{t('budgetUsed')}</span><span>{formatBudgetPercentage(summary.percentageUsed)}</span></div><Progress value={Math.min(100, summary.percentageUsed)} className="h-3" /></div><div><h3 className="font-black text-kharcha-navy">{t('budgetBreakdown')}</h3><div className="mt-2 space-y-2">{Object.entries(summary.byCategory).length ? Object.entries(summary.byCategory).sort(([, a], [, b]) => b - a).map(([category, amount]) => <div key={category} className="flex items-center justify-between rounded-lg bg-[#fffaf3] px-3 py-2 text-sm"><span>{category}</span><strong>{money(amount)}</strong></div>) : <p className="text-sm text-gray-500">{t('budgetNoSpend')}</p>}</div></div>{history.length > 0 && <div><h3 className="font-black text-kharcha-navy">{t('budgetHistory')}</h3><div className="mt-2 space-y-2">{history.map(item => <div key={item.label} className="rounded-lg border px-3 py-2"><div className="flex items-center justify-between text-sm font-bold"><span>{item.label}</span><span>{money(item.summary.remaining)} {t('budgetRemaining').toLowerCase()}</span></div><p className="mt-1 text-xs text-gray-500">{t('budgetTotal')}: {money(item.summary.budget)} · {t('budgetSpent')}: {money(item.summary.spent)}</p></div>)}</div></div>}</div>}</DialogContent></Dialog>;
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: 'orange' | 'green' }) {
  return <div className="rounded-xl bg-[#fffaf3] p-3 text-center"><p className="text-[11px] font-bold text-gray-500">{label}</p><p className={`mt-1 font-black ${accent === 'orange' ? 'text-[#e87817]' : accent === 'green' ? 'text-[#16834b]' : 'text-kharcha-navy'}`}>{value}</p></div>;
}
