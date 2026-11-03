import { useMemo } from 'react';
import { Copy, Landmark, Receipt, Users, Wallet } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import AppSectionHeader from '@/components/AppSectionHeader';
import InstallAppButton from '@/components/InstallAppButton';
import SharedUpiPayCard from '@/components/SharedUpiPayCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { copyToClipboard } from '@/lib/shareLink';
import { formatCurrency } from '@/lib/utils';
import { decodeFundSnapshot } from '@/share/fundShare';
import { getShortSharePayload } from '@/share/origin';

export default function SharedFundView() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const payload = getShortSharePayload('f');
  const fund = useMemo(() => (payload ? decodeFundSnapshot(payload) : null), [payload]);

  if (!fund) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f7fc] p-4">
        <Card className="max-w-md rounded-3xl border-t-4 border-t-[#038f27] bg-white p-8 text-center shadow-md">
          <p className="mb-3 text-lg font-black text-[#023b81]">{t('auditInvalidShareLink' as any)}</p>
          <p className="mb-6 text-gray-600">{t('auditShareLinkExpired' as any)}</p>
          <Button variant="fund" onClick={() => navigate('/')}>{t('auditBackToHome' as any)}</Button>
        </Card>
      </div>
    );
  }

  const collected = fund.members.reduce((s, m) => s + m.paid, 0) + fund.startingBalance;
  const spent = fund.expenses.reduce((s, e) => s + e.amount, 0);
  const stats = [
    { label: t('auditTotalCollected' as any), value: collected, color: '#038f27', icon: Wallet },
    { label: t('auditTotalExpenses' as any), value: spent, color: '#fd6d00', icon: Receipt },
    { label: t('auditRemainingBalance' as any), value: collected - spent, color: '#023b81', icon: Landmark },
  ];
  const dateText = (v: number) => new Date(v).toLocaleDateString(language === 'en' ? 'en-IN' : `${language}-IN`);

  return (
    <div className="min-h-screen bg-[#f3f7fc] pb-24">
      <AppSectionHeader
        title={fund.name}
        subtitle={`${t('auditReadOnlyView' as any)}${fund.purpose ? ` · ${fund.purpose}` : ''}`}
        icon={<Landmark size={26} />}
        accent="green"
        onBack={() => navigate('/')}
        backLabel={t('auditBackToKharcha' as any)}
        actions={<Button variant="soft" className="w-full min-h-11" onClick={async () => {
          if (await copyToClipboard(window.location.href)) toast.success(t('linkCopied'));
          else toast.error(t('failedCopy'));
        }}><Copy size={16} className="mr-2" />{t('copyLink')}</Button>}
      />
      <div className="space-y-4 p-4">
        {fund.description && <Card className="rounded-3xl bg-white p-4 text-sm text-gray-700 shadow-sm">{fund.description}</Card>}
        <div className="grid grid-cols-3 gap-2">
          {stats.map(s => (
            <Card key={s.label} className="overflow-hidden rounded-2xl bg-white p-0 shadow-sm">
              <div className="h-1.5" style={{ background: s.color }} />
              <div className="p-3">
                <s.icon size={18} style={{ color: s.color }} />
                <p className="mt-1 text-[11px] font-bold leading-tight text-gray-600">{s.label}</p>
                <p className="text-sm font-black text-[#023b81]">{formatCurrency(s.value)}</p>
              </div>
            </Card>
          ))}
        </div>
        <SharedUpiPayCard payees={fund.upiId ? [{ name: fund.name, upiId: fund.upiId, note: fund.name }] : []} accent="green" />
        <Card className="overflow-hidden rounded-3xl bg-white p-0 shadow-md">
          <div className="flex items-center gap-2 border-l-[6px] border-[#038f27] px-4 py-3 font-black text-[#023b81]"><Users size={18} className="text-[#038f27]" />{t('auditMembers' as any)} ({fund.members.length})</div>
          <div className="divide-y">
            {fund.members.map((m, i) => (
              <div key={`${m.name}-${i}`} className="flex items-center justify-between px-4 py-3">
                <span className="truncate font-semibold text-gray-800">{m.name}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${m.paid > 0 ? 'bg-[#e6f6ea] text-[#038f27]' : 'bg-[#fff1e6] text-[#fd6d00]'}`}>{m.paid > 0 ? formatCurrency(m.paid) : t('auditPending' as any)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="overflow-hidden rounded-3xl bg-white p-0 shadow-md">
          <div className="flex items-center gap-2 border-l-[6px] border-[#fd6d00] px-4 py-3 font-black text-[#023b81]"><Receipt size={18} className="text-[#fd6d00]" />{t('auditExpenseLedger' as any)}</div>
          {fund.expenses.length === 0 ? <p className="px-4 pb-4 text-sm text-gray-500">{t('auditNoExpensesRecorded' as any)}</p> : (
            <div className="divide-y">
              {fund.expenses.map((e, i) => (
                <div key={`${e.name}-${i}`} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0"><p className="truncate font-semibold text-gray-800">{e.name}</p><p className="text-xs text-gray-500">{dateText(e.date)}</p></div>
                  <span className="font-black text-[#023b81]">{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <InstallAppButton />
      </div>
    </div>
  );
}
