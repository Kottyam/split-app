from pathlib import Path
import re

path = Path('/home/ubuntu/kharcha/client/src/pages/PersonalBudget.tsx')
text = path.read_text()
replacement = r'''function ExpenseModal({ t, form, setForm, categories, error, editing, onClose, onSave }: any) {
  const selected = categories.find((category: ExpenseCategoryDefinition) => category.name === form.category);
  const entryOptions: ExpenseType[] = ['Daily', 'Weekly', 'OneTime'];
  const entryLabel = (option: ExpenseType) => option === 'OneTime' ? t('auditOtherOneTime' as any) : option === 'Weekly' ? t('auditWeeklyExpense' as any) : t('auditDailyExpense' as any);
  const title = editing ? `${t('personalBudgetEdit')} ${t('personalBudgetExpenses')}` : `${t('personalBudgetAddExpense')} · ${entryLabel(form.expenseType)}`;
  return <ModalShell title={title} onClose={onClose}>
    <div className="mt-4 space-y-3">
      {!editing && !form.recurringRuleId && <div className="grid grid-cols-3 gap-2">{entryOptions.map(option => <button key={option} type="button" onClick={() => setForm({ ...form, expenseType: option, weekLabel: option === 'Weekly' ? form.weekLabel : '' })} className={`min-h-10 rounded-xl border-2 border-black px-2 text-xs font-black ${form.expenseType === option ? 'bg-[#16834b] text-white' : 'bg-white text-black'}`}>{entryLabel(option)}</button>)}</div>}
      <Field label={form.expenseType === 'Weekly' ? t('auditWeeklyAmount' as any) : t('personalBudgetAmount')}><Input type="number" min="0.01" inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="1500" className="mt-1 min-h-11 border-2 border-black" /></Field>
      {form.expenseType === 'Weekly' && <Field label={t('auditWeekOf' as any)}><Input type="date" value={form.weekLabel || form.date} onChange={e => setForm({ ...form, weekLabel: e.target.value, date: e.target.value })} className="mt-1 min-h-11 border-2 border-black" /></Field>}
      <div className="grid gap-3 sm:grid-cols-2"><Field label={t('personalBudgetCategory')}><SelectField value={form.category} onChange={category => setForm({ ...form, category, subcategory: categories.find((item: ExpenseCategoryDefinition) => item.name === category)?.subcategories?.[0] ?? '' })} options={categories.map((category: ExpenseCategoryDefinition) => String(category.name))} /></Field><Field label={t('personalBudgetSubcategory')}><SelectField value={form.subcategory} onChange={subcategory => setForm({ ...form, subcategory })} options={selected?.subcategories?.length ? selected.subcategories : ['Other']} /></Field></div>
      <div className="grid gap-3 sm:grid-cols-2"><Field label={t('personalBudgetTransactionDate')}><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1 min-h-11 border-2 border-black" /></Field><Field label={t('personalBudgetPaymentMethod')}><SelectField value={form.paymentMethod} onChange={paymentMethod => setForm({ ...form, paymentMethod })} options={paymentMethods} /></Field></div>
      <Field label={t('personalBudgetPerson')}><SelectField value={form.personId} onChange={personId => setForm({ ...form, personId })} options={['Self', 'Other']} /></Field>
      <Field label={t('personalBudgetNote')}><Input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder={t('auditOptionalNote' as any)} className="mt-1 min-h-11 border-2 border-black" /></Field>
      <label className="flex min-h-11 items-center gap-2 rounded-xl border-2 border-black bg-[#fffaf3] px-3 text-sm font-black"><Checkbox checked={form.status === 'Paid'} onCheckedChange={checked => setForm({ ...form, status: checked === true ? 'Paid' : 'Planned' })} />{t('auditMarkAsPaid' as any)}</label>
      <label className="flex min-h-11 items-center gap-2 rounded-xl border-2 border-black bg-[#f2fbf3] px-3 text-sm font-black"><Checkbox checked={form.includeInBudget} onCheckedChange={checked => setForm({ ...form, includeInBudget: checked === true })} />{t('personalBudgetIncludeInBudget')}</label>
      <ErrorText error={error} /><Button onClick={onSave} className="min-h-12 w-full rounded-xl border-2 border-black bg-[#e87817] font-black text-white">{t('personalBudgetSave')}</Button>
    </div>
  </ModalShell>;
}'''
pattern = r"function ExpenseModal\(\{ t, form,.*?\n\nfunction CategoryModal"
updated, count = re.subn(pattern, replacement + "\n\nfunction CategoryModal", text, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f'Expected one ExpenseModal block, found {count}')
path.write_text(updated)
print('replaced ExpenseModal')
