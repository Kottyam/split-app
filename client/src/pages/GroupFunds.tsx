import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { getGroupFunds, deleteGroupFund } from '@/groupFund/storage';
import { getLifetimeCollectedAmount } from '@/groupFund/collection';
import type { GroupFund } from '@/groupFund/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Landmark, Plus, Wallet, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeleteConfirmation } from '@/contexts/DeleteConfirmationContext';
import AppSectionHeader from '@/components/AppSectionHeader';
import BottomNavigation from '@/components/BottomNavigation';

export default function GroupFunds() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const { requestDelete } = useDeleteConfirmation();
  const [funds, setFunds] = useState<GroupFund[]>(() => getGroupFunds());

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    requestDelete({
      title: t('auditDeleteFundConfirm' as any, { name }),
      message: t('auditActionCannotUndo' as any),
      onConfirm: () => {
        deleteGroupFund(id);
        setFunds(getGroupFunds());
        toast.success(t('auditFundDeleted' as any, { name }));
      },
    });
  };

  return (
    <div className="min-h-screen bg-kharcha-cream px-3 pb-24 pt-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-4xl space-y-5 sm:space-y-6">
        <AppSectionHeader
          title={t('auditGroupFundsTitle' as any)}
          subtitle={t('groupFundsDescription' as any)}
          icon={<Landmark size={24} />}
          accent="green"
          onBack={() => navigate('/')}
          backLabel={t('backToKharcha' as any)}
          actions={<Button variant="fund" onClick={() => navigate('/group-funds/new')} className="w-full min-h-12 px-3 text-base sm:px-4"><Plus size={18} className="mr-1" /> {t('auditNewFund' as any)}</Button>}
        />

        {funds.length === 0 ? (
          <Card className="items-center rounded-[26px] border border-[#cdebd5] bg-white p-10 text-center shadow-[0_10px_28px_rgba(3,143,39,0.10)] sm:p-12">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#038f27] text-white shadow-md"><Wallet size={30} /></span>
            <h2 className="mt-4 text-xl font-black text-kharcha-navy">{t('auditNoFunds' as any)}</h2>
            <p className="mt-2 text-sm text-gray-600">{t('auditNoFundsDescription' as any)}</p>
            <Button variant="fund" onClick={() => navigate('/group-funds/new')} className="mt-4 min-h-12 w-full max-w-xs">
              <Plus size={18} />
              {t('auditCreateFirstFund' as any)}
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {funds.map(f => {
              const totalCollected = getLifetimeCollectedAmount(f.contributions, f.startingBalance ?? 0);
              const totalSpent = (f.expenses ?? []).filter(e => e.status === 'active').reduce((s, e) => s + e.amount, 0);
              const balance = totalCollected - totalSpent;
              const fundTypeLabel = f.isRecurring ? t('recurringCollection' as any) : t('pbOneTime' as any);
              return (
                <Card
                  key={f.id}
                  onClick={() => navigate(`/group-funds/${f.id}`)}
                  className="relative flex cursor-pointer flex-col justify-between gap-0 overflow-hidden rounded-[22px] border border-[#e3ebf3] bg-white py-4 pl-5 pr-4 shadow-[0_10px_28px_rgba(2,59,129,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(2,59,129,0.14)] sm:p-5 sm:pl-6"
                >
                  <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-[#038f27]" />
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-[#dff1e5] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-kharcha-green">{fundTypeLabel}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(f.id, f.name, e)}
                        className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e6f6ea] text-[#038f27]"><Landmark size={22} /></span>
                      <h3 className="min-w-0 truncate text-lg font-black text-[#023b81] sm:text-xl">{f.name}</h3>
                    </div>
                    {f.description && <p className="mt-1 line-clamp-2 text-xs font-medium text-black">{f.description}</p>}
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#f2fbf3] px-2.5 py-1 text-xs font-black text-kharcha-green">
                      <span>{f.purpose}{f.isRecurring && f.recurringFrequency ? ` · ${f.recurringFrequency}` : ''}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#f5faf6] px-3 py-2.5">
                    <div>
                      <p className="text-[11px] font-bold text-gray-500">{t('auditCollected' as any)}</p>
                      <p className="text-base font-black text-kharcha-green">₹{totalCollected.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-500">{t('auditBalance' as any)}</p>
                      <p className={`text-base font-black ${balance >= 0 ? 'text-kharcha-navy' : 'text-red-600'}`}>₹{balance.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-gray-500">{t('auditMembers' as any)}</p>
                      <p className="text-base font-black text-kharcha-navy">{f.members.length}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
}
