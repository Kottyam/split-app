import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { getGroupFunds, deleteGroupFund } from '@/groupFund/storage';
import type { GroupFund } from '@/groupFund/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Users, Wallet, Trash2 } from 'lucide-react';
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
          onBack={() => navigate('/')}
          backLabel={t('backToKharcha' as any)}
          actions={<Button onClick={() => navigate('/group-funds/new')} className="w-full min-h-10 rounded-xl bg-[#16834b] px-3 font-black text-white shadow-sm hover:bg-green-700 sm:px-4"><Plus size={18} className="mr-1" /> {t('auditNewFund' as any)}</Button>}
        />

        {funds.length === 0 ? (
          <Card className="rounded-3xl border border-[#d1e5d7] bg-white p-10 text-center shadow-sm sm:p-12">
            <Wallet className="mx-auto h-12 w-12 text-[#16834b]" />
            <h2 className="mt-4 text-xl font-black text-kharcha-navy">{t('auditNoFunds' as any)}</h2>
            <p className="mt-2 text-sm text-gray-600">{t('auditNoFundsDescription' as any)}</p>
            <Button onClick={() => navigate('/group-funds/new')} className="mt-6 rounded-xl bg-[#16834b] font-bold text-white shadow-sm hover:bg-[#11663b]">
              {t('auditCreateFirstFund' as any)}
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {funds.map(f => {
              const totalCollected = f.contributions.filter(c => c.status === 'Paid').reduce((s, c) => s + c.amount, 0) + (f.startingBalance ?? 0);
              const totalSpent = (f.expenses ?? []).filter(e => e.status === 'active').reduce((s, e) => s + e.amount, 0);
              const balance = totalCollected - totalSpent;
              const fundTypeLabel = f.isRecurring ? t('recurringCollection' as any) : t('pbOneTime' as any);
              return (
                <Card
                  key={f.id}
                  onClick={() => navigate(`/group-funds/${f.id}`)}
                  className="flex cursor-pointer flex-col justify-between rounded-3xl border border-[#b9ddc9] bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg sm:p-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-[#dff1e5] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#16834b]">{fundTypeLabel}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(f.id, f.name, e)}
                        className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    <h3 className="mt-3 text-lg font-black text-kharcha-navy sm:text-xl">{f.name}</h3>
                    {f.description && <p className="mt-1 line-clamp-2 text-xs font-medium text-black">{f.description}</p>}
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#f2fbf3] px-2.5 py-1 text-xs font-black text-[#16834b]">
                      <span>{f.purpose}{f.isRecurring && f.recurringFrequency ? ` · ${f.recurringFrequency}` : ''}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#e8eee9] pt-4">
                    <div>
                      <p className="text-[11px] font-bold text-gray-500">{t('auditCollected' as any)}</p>
                      <p className="text-base font-black text-[#16834b]">₹{totalCollected.toLocaleString('en-IN')}</p>
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
