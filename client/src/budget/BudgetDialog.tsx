import React, { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import type { BudgetConfig, SharedHomeBudgetSettings } from './types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  periodLabel: string;
  initial?: BudgetConfig;
  sharedHome?: boolean;
  initialSettings?: SharedHomeBudgetSettings;
  onSave: (config: BudgetConfig, settings?: SharedHomeBudgetSettings) => void;
}

export default function BudgetDialog({ open, onOpenChange, title, periodLabel, initial, sharedHome = false, initialSettings, onSave }: Props) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [threshold, setThreshold] = useState('80');
  const [useSameBudget, setUseSameBudget] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setAmount(initial?.amount ? String(initial.amount) : '');
    setThreshold(String((initial?.warningThreshold ?? initialSettings?.warningThreshold ?? 0.8) * 100));
    setUseSameBudget(initialSettings?.useSameBudgetEveryMonth ?? false);
    setError('');
  }, [open, initial, initialSettings]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const parsedThreshold = Number(threshold) / 100;
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t('budgetAmountRequired'));
      return;
    }
    if (!Number.isFinite(parsedThreshold) || parsedThreshold <= 0 || parsedThreshold > 1) {
      setError(t('budgetThresholdInvalid'));
      return;
    }
    const now = Date.now();
    const config: BudgetConfig = { amount: parsedAmount, warningThreshold: parsedThreshold, createdAt: initial?.createdAt ?? now, updatedAt: now };
    const settings = sharedHome ? { useSameBudgetEveryMonth: useSameBudget, defaultAmount: useSameBudget ? parsedAmount : initialSettings?.defaultAmount, warningThreshold: parsedThreshold, updatedAt: now } : undefined;
    onSave(config, settings);
    onOpenChange(false);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md rounded-2xl border-2 border-[#16834b] bg-white">
      <DialogHeader><DialogTitle className="flex items-center gap-2 text-xl font-black text-kharcha-navy"><Wallet className="text-[#e87817]" size={22} />{title}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-xl bg-[#fffaf3] p-3 text-sm text-gray-700"><strong>{t('budgetPeriod')}:</strong> {periodLabel}</div>
        <div className="space-y-2"><Label htmlFor="budget-amount">{t('budgetAmount')} *</Label><Input id="budget-amount" type="number" min="1" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="₹20,000" autoFocus /></div>
        <div className="space-y-2"><Label htmlFor="budget-threshold">{t('budgetWarningThreshold')}</Label><Input id="budget-threshold" type="number" min="1" max="100" step="1" value={threshold} onChange={event => setThreshold(event.target.value)} /><p className="text-xs text-gray-500">{t('budgetWarningThresholdHelp')}</p></div>
        {sharedHome && <label className="flex items-start gap-3 rounded-xl border p-3"><Checkbox checked={useSameBudget} onCheckedChange={value => setUseSameBudget(Boolean(value))} /><span><strong className="block text-sm">{t('budgetUseSameEveryMonth')}</strong><span className="text-xs text-gray-500">{t('budgetUseSameEveryMonthHelp')}</span></span></label>}
        {error && <p className="text-sm font-semibold text-red-600" role="alert">{error}</p>}
        <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button><Button type="submit" className="bg-[#16834b] text-white hover:bg-[#11663b]">{t('budgetSave')}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
