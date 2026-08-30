import React from 'react';
import { Wallet, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatBudgetPercentage, type BudgetSummary } from './types';

interface Props {
  summary: BudgetSummary;
  onOpenDetails: () => void;
  onEdit: () => void;
}

function money(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function BudgetCard({ summary, onOpenDetails, onEdit }: Props) {
  const { t } = useLanguage();
  if (!summary.configured) {
    return <Card className="rounded-2xl border-2 border-dashed border-[#e87817] bg-[#fffaf3] p-4"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ffe0bc] text-[#b95000]"><Wallet size={20} /></span><div className="min-w-0 flex-1"><p className="text-xs font-black uppercase tracking-wide text-[#b95000]">{t('budget')}</p><h3 className="mt-1 text-lg font-black text-kharcha-navy">{t('budgetNoBudget')}</h3><p className="mt-1 text-sm text-gray-600">{t('budgetSetDescription')}</p><Button size="sm" className="mt-3 bg-[#e87817] text-white hover:bg-[#c85f0b]" onClick={onEdit}>{t('budgetSet')}</Button></div></div></Card>;
  }
  const statusLabel = summary.status === 'exceeded' ? t('budgetExceeded') : summary.status === 'near-limit' ? t('budgetNearLimit') : t('budgetUnderBudget');
  const statusClass = summary.status === 'exceeded' ? 'bg-red-50 text-red-700 border-red-200' : summary.status === 'near-limit' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-[#f2fbf3] text-[#16834b] border-[#b9ddc9]';
  const progress = Math.min(100, Math.max(0, summary.percentageUsed));
  return <Card role="button" tabIndex={0} onClick={onOpenDetails} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onOpenDetails(); }} className="cursor-pointer rounded-2xl border-2 border-[#e7d7bd] bg-white p-4 transition-shadow hover:shadow-md"><div className="android-budget-header flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ffe0bc] text-[#b95000]"><Wallet size={20} /></span><div className="min-w-0"><p className="text-xs font-black uppercase tracking-wide text-[#b95000]">{t('budget')}</p><h3 className="break-words text-lg font-black text-kharcha-navy">{t('budgetDetails')}</h3></div></div><Button size="sm" variant="outline" className="android-budget-edit shrink-0" onClick={event => { event.stopPropagation(); onEdit(); }}>{t('budgetEdit')}</Button></div><div className="android-budget-metrics mt-4 grid grid-cols-3 gap-2 text-center"><div><p className="text-[11px] font-bold text-gray-500">{t('budgetTotal')}</p><p className="font-black text-kharcha-navy">{money(summary.budget)}</p></div><div><p className="text-[11px] font-bold text-gray-500">{t('budgetSpent')}</p><p className="font-black text-[#e87817]">{money(summary.spent)}</p></div><div><p className="text-[11px] font-bold text-gray-500">{summary.status === 'exceeded' ? t('budgetOver') : t('budgetRemaining')}</p><p className={`font-black ${summary.status === 'exceeded' ? 'text-red-600' : 'text-[#16834b]'}`}>{money(summary.status === 'exceeded' ? summary.overBudget : summary.remaining)}</p></div></div><div className="mt-4"><div className="flex items-center justify-between text-xs font-bold text-gray-500"><span>{t('budgetUsed')}</span><span>{formatBudgetPercentage(summary.percentageUsed)}</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-[#e8eee9]"><div className={`h-full rounded-full ${summary.status === 'exceeded' ? 'bg-red-500' : summary.status === 'near-limit' ? 'bg-amber-500' : 'bg-[#16834b]'}`} style={{ width: `${progress}%` }} /></div></div><div className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${statusClass}`}>{summary.status !== 'under-budget' && <AlertTriangle size={16} />}{statusLabel}{summary.status === 'exceeded' ? ` · ${money(summary.overBudget)} ${t('budgetOver').toLowerCase()}` : summary.status === 'near-limit' ? ` · ${money(summary.remaining)} ${t('budgetRemaining').toLowerCase()}` : ''}</div></Card>;
}
