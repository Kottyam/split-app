import { useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { Calculator, Pencil, Plus, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { computeEstimateSummary, ESTIMATE_CATEGORIES, validateEstimateInput } from '@/groupFund/estimates';
import type { FundEstimate } from '@/groupFund/types';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

interface Props {
  estimates?: FundEstimate[];
  collected: number;
  expenses: number;
  activeMembers: number;
  budget?: number;
  /** Omit for a read-only view (shared page). */
  onChange?: (next: FundEstimate[], message: string) => void;
}

/** Planned cost line items (hotel, food, travel…) vs collected vs actual spend. Separate from the optional budget. */
export default function FundEstimatesCard({ estimates, collected, expenses, activeMembers, budget, onChange }: Props) {
  const list = estimates || [];
  const summary = computeEstimateSummary(list, collected, expenses, activeMembers, budget);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('Other');
  const [note, setNote] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const editable = Boolean(onChange);
  if (!editable && !summary) return null;

  const resetForm = () => { setEditingId(null); setName(''); setAmount(''); setCategory('Other'); setNote(''); };

  const submit = () => {
    const v = validateEstimateInput(name, amount);
    if (!v.ok) {
      toast.error(v.field === 'name' ? 'Enter what the estimate is for (e.g. Hotel)' : 'Enter an estimated amount greater than 0');
      (v.field === 'name' ? nameRef : amountRef).current?.focus();
      return;
    }
    if (editingId) {
      onChange!(list.map(e => e.id === editingId ? { ...e, name: v.name, amount: v.amount, category, note: note.trim() || undefined } : e), `Updated estimate: ${v.name}`);
      toast.success('Estimate updated');
    } else {
      onChange!([...list, { id: nanoid(), name: v.name, amount: v.amount, category, note: note.trim() || undefined, createdAt: Date.now() }], `Added estimate: ${v.name} ₹${v.amount}`);
      toast.success('Estimate added');
    }
    resetForm();
  };

  const startEdit = (e: FundEstimate) => {
    setEditingId(e.id); setName(e.name); setAmount(String(e.amount)); setCategory(e.category || 'Other'); setNote(e.note || '');
    setTimeout(() => nameRef.current?.focus(), 0);
  };

  const remove = (e: FundEstimate) => {
    if (!window.confirm(`Delete estimate "${e.name}"?`)) return;
    onChange!(list.filter(x => x.id !== e.id), `Deleted estimate: ${e.name}`);
    if (editingId === e.id) resetForm();
  };

  return (
    <Card className="rounded-2xl border border-kharcha-line bg-white p-5 shadow-sm" data-testid="fund-estimates-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-kharcha-navy flex items-center gap-1.5"><Calculator size={14} /> Estimates</p>
          <h3 className="mt-1 text-2xl font-black text-[#023b81]">{inr(summary?.totalEstimated || 0)}</h3>
          <p className="text-xs text-slate-500">Planned costs to decide how much to collect</p>
        </div>
        {summary && activeMembers > 0 && (
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-wider text-kharcha-navy">Per member</p>
            <p className="mt-1 text-lg font-black text-kharcha-navy" data-testid="estimate-per-member">{inr(summary.perMember)}</p>
          </div>
        )}
      </div>

      {summary && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4" data-testid="estimate-summary">
          <div className="rounded-xl bg-slate-50 p-2"><p className="text-[11px] font-bold text-slate-500">Estimated</p><p className="font-black text-[#023b81]">{inr(summary.totalEstimated)}</p></div>
          <div className="rounded-xl bg-green-50 p-2"><p className="text-[11px] font-bold text-slate-500">Collected</p><p className="font-black text-[#16834b]">{inr(summary.collected)}</p></div>
          <div className="rounded-xl bg-orange-50 p-2"><p className="text-[11px] font-bold text-slate-500">Spent</p><p className="font-black text-[#c2410c]">{inr(summary.expenses)}</p></div>
          {summary.budget ? <div className="rounded-xl bg-blue-50 p-2"><p className="text-[11px] font-bold text-slate-500">Budget</p><p className="font-black text-[#023b81]">{inr(summary.budget)}</p></div> : <div className="rounded-xl bg-slate-50 p-2"><p className="text-[11px] font-bold text-slate-500">Left in estimate</p><p className={`font-black ${summary.remainingEstimate >= 0 ? 'text-[#16834b]' : 'text-red-600'}`}>{inr(summary.remainingEstimate)}</p></div>}
        </div>
      )}
      {summary && (
        <div className="mt-3 space-y-1.5 text-sm font-bold">
          {summary.toCollect > 0
            ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">Collect {inr(summary.toCollect)} more to cover the estimate</p>
            : <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-green-700">Collections cover the estimate</p>}
          {summary.remainingEstimate < 0 && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700">Spent {inr(-summary.remainingEstimate)} more than estimated</p>}
          {summary.overBudgetBy > 0 && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700">Estimate is {inr(summary.overBudgetBy)} over the budget</p>}
        </div>
      )}

      {list.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-kharcha-line" data-testid="estimate-list">
          {list.map(e => (
            <li key={e.id} className="flex items-center gap-2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-black text-kharcha-navy">{e.name}</p>
                <p className="truncate text-xs text-slate-500">{e.category || 'Other'}{e.note ? ` · ${e.note}` : ''}</p>
              </div>
              <span className="font-black text-kharcha-navy">{inr(e.amount)}</span>
              {editable && <>
                <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${e.name}`} onClick={() => startEdit(e)}><Pencil size={15} /></Button>
                <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${e.name}`} onClick={() => remove(e)} className="text-red-600"><Trash2 size={15} /></Button>
              </>}
            </li>
          ))}
        </ul>
      )}

      {editable && (
        <form className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3" onSubmit={ev => { ev.preventDefault(); submit(); }} data-testid="estimate-form">
          <p className="text-xs font-black uppercase tracking-wider text-kharcha-navy">{editingId ? 'Edit estimate' : 'Add estimate'}</p>
          <div className="grid grid-cols-[1fr_7rem] gap-2">
            <Input ref={nameRef} id="estimate-name" aria-label="Estimate item" placeholder="Item (e.g. Hotel)" value={name} onChange={e => setName(e.target.value)} className="bg-white" />
            <Input ref={amountRef} id="estimate-amount" aria-label="Estimated amount" type="number" inputMode="decimal" min="0" placeholder="₹ Amount" value={amount} onChange={e => setAmount(e.target.value)} className="bg-white" />
          </div>
          <div className="grid grid-cols-[8rem_1fr] gap-2">
            <select aria-label="Estimate category" value={category} onChange={e => setCategory(e.target.value)} className="h-9 rounded-md border border-input bg-white px-2 text-sm">
              {ESTIMATE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Input aria-label="Estimate note" placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} className="bg-white" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 bg-kharcha-green text-white font-bold">{editingId ? <><Check size={16} className="mr-1" /> Save</> : <><Plus size={16} className="mr-1" /> Add estimate</>}</Button>
            {editingId && <Button type="button" variant="outline" onClick={resetForm}><X size={16} className="mr-1" /> Cancel</Button>}
          </div>
        </form>
      )}
    </Card>
  );
}
