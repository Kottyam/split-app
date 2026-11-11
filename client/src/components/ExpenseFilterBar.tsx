import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  EMPTY_EXPENSE_FILTERS,
  countActiveExpenseFilters,
  getActiveDatePreset,
  getDatePresetRange,
  type DatePreset,
  type ExpenseFilterState,
} from '@/lib/expenseFilters';

export interface ExpenseFilterCategoryOption {
  value: string;
  label: string;
}

interface ExpenseFilterBarProps {
  value: ExpenseFilterState;
  onChange: (next: ExpenseFilterState) => void;
  categories: ExpenseFilterCategoryOption[];
  /** Translation key for the search placeholder. */
  searchPlaceholderKey: string;
  /** Shown count/total; the summary row appears only while a filter is active. */
  resultCount: number;
  totalCount: number;
  filteredTotal: number;
  /** True when filters outside this bar (e.g. Trip payer filter) are also active. */
  externalActive?: boolean;
  onClearExternal?: () => void;
  testIdPrefix: string;
}

const PRESETS: Array<{ id: DatePreset; key: string }> = [
  { id: 'today', key: 'expFilterToday' },
  { id: 'last7', key: 'expFilterLast7Days' },
  { id: 'thisMonth', key: 'expFilterThisMonth' },
  { id: 'lastMonth', key: 'expFilterLastMonth' },
];

const formatRupees = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Compact, collapsible search + filter bar for expense lists. View-only: it never changes stored data. */
export default function ExpenseFilterBar({
  value,
  onChange,
  categories,
  searchPlaceholderKey,
  resultCount,
  totalCount,
  filteredTotal,
  externalActive = false,
  onClearExternal,
  testIdPrefix,
}: ExpenseFilterBarProps) {
  const { t } = useLanguage();
  const tr = (key: string, vars?: Record<string, string | number>) => t(key as any, vars);
  const [open, setOpen] = useState(false);
  const panelCount = (value.category ? 1 : 0) + (value.from || value.to ? 1 : 0);
  const anyActive = countActiveExpenseFilters(value) > 0 || externalActive;
  const activePreset = getActiveDatePreset(value);
  const set = (patch: Partial<ExpenseFilterState>) => onChange({ ...value, ...patch });

  const clearAll = () => {
    onChange(EMPTY_EXPENSE_FILTERS);
    onClearExternal?.();
  };

  const field = 'border border-kharcha-line dark:border-border bg-white dark:bg-card text-kharcha-navy dark:text-foreground rounded-lg';

  return (
    <div className="space-y-2" data-testid={`${testIdPrefix}-filters`}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-muted-foreground pointer-events-none" aria-hidden />
          <Input
            type="search"
            inputMode="search"
            value={value.query}
            onChange={e => set({ query: e.target.value })}
            placeholder={tr(searchPlaceholderKey)}
            aria-label={tr(searchPlaceholderKey)}
            className={`${field} pl-8 pr-8 h-10 text-sm`}
            data-testid={`${testIdPrefix}-search`}
          />
          {value.query && (
            <button
              type="button"
              onClick={() => set({ query: '' })}
              aria-label={tr('expFilterClearSearch')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 hover:text-black dark:text-muted-foreground dark:hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls={`${testIdPrefix}-filter-panel`}
          className={`${field} h-10 px-3 font-bold shrink-0 ${open || panelCount ? 'ring-2 ring-blue-200 dark:ring-ring/40' : ''}`}
          data-testid={`${testIdPrefix}-filter-toggle`}
        >
          <SlidersHorizontal size={16} className="mr-1" />
          <span className="hidden min-[380px]:inline">{tr('expFilterFilters')}</span>
          {panelCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black dark:bg-primary px-1 text-[11px] font-black text-white dark:text-primary-foreground">
              {panelCount}
            </span>
          )}
        </Button>
      </div>

      {open && (
        <div
          id={`${testIdPrefix}-filter-panel`}
          className="rounded-xl border border-kharcha-line dark:border-border bg-white dark:bg-card p-3 space-y-3 shadow-sm"
          data-testid={`${testIdPrefix}-filter-panel`}
        >
          <div>
            <label className="text-xs font-black text-kharcha-navy dark:text-foreground">{tr('expFilterCategory')}</label>
            <Select value={value.category || 'all'} onValueChange={v => set({ category: v === 'all' ? '' : v })}>
              <SelectTrigger className={`${field} mt-1 h-9 w-full text-sm font-semibold`} data-testid={`${testIdPrefix}-category`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border border-kharcha-line dark:border-border">
                <SelectItem value="all">{tr('expFilterAllCategories')}</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => {
              const active = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => (active ? set({ from: '', to: '' }) : set(getDatePresetRange(p.id)))}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${active
                    ? 'border-black bg-black text-white dark:border-primary dark:bg-primary dark:text-primary-foreground'
                    : 'border-kharcha-line bg-white text-kharcha-navy hover:bg-blue-50 dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-accent'}`}
                  data-testid={`${testIdPrefix}-preset-${p.id}`}
                >
                  {tr(p.key)}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label className="text-xs font-black text-kharcha-navy dark:text-foreground" htmlFor={`${testIdPrefix}-from`}>{tr('expFilterFrom')}</label>
              <Input
                id={`${testIdPrefix}-from`}
                type="date"
                value={value.from}
                max={value.to || undefined}
                onChange={e => set({ from: e.target.value })}
                className={`${field} mt-1 h-9 text-sm`}
                data-testid={`${testIdPrefix}-from`}
              />
            </div>
            <div className="min-w-0">
              <label className="text-xs font-black text-kharcha-navy dark:text-foreground" htmlFor={`${testIdPrefix}-to`}>{tr('expFilterTo')}</label>
              <Input
                id={`${testIdPrefix}-to`}
                type="date"
                value={value.to}
                min={value.from || undefined}
                onChange={e => set({ to: e.target.value })}
                className={`${field} mt-1 h-9 text-sm`}
                data-testid={`${testIdPrefix}-to`}
              />
            </div>
          </div>
        </div>
      )}

      {anyActive && (
        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm dark:border-border dark:bg-accent"
          data-testid={`${testIdPrefix}-summary`}
          aria-live="polite"
        >
          <div className="min-w-0">
            <p className="font-bold text-kharcha-navy dark:text-foreground">{tr('expFilterShowing', { count: resultCount, total: totalCount })}</p>
            <p className="text-xs text-kharcha-navy/80 dark:text-muted-foreground">
              {tr('expFilterFilteredTotal')}: <span className="font-black text-blue-700 dark:text-foreground">{formatRupees(filteredTotal)}</span>
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            data-testid={`${testIdPrefix}-clear`}
          >
            <X size={14} className="mr-1" /> {tr('expFilterClear')}
          </Button>
        </div>
      )}
    </div>
  );
}
