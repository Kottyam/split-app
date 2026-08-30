import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getEncodedDataFromUrl, decodeTripData, copyToClipboard } from '@/lib/shareLink';
import { generateTripSummary } from '@/lib/calculations';
import { getCategoryInfo } from '@/lib/categories';
import { formatCurrency } from '@/lib/utils';
import SettlementView from '@/components/SettlementView';
import DashboardView from '@/components/DashboardView';
import SharedTripViewOnlyHeader from '@/components/SharedTripViewOnlyHeader';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

function formatSharedViewDate(value: number, language: string): string {
  return new Date(value).toLocaleDateString(language === 'en' ? 'en-IN' : `${language}-IN`);
}

export default function SharedView() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const encodedData = getEncodedDataFromUrl();

  const trip = useMemo(() => {
    if (!encodedData) return null;
    return decodeTripData(encodedData);
  }, [encodedData]);

  const summary = useMemo(() => {
    if (!trip) return null;
    return generateTripSummary(trip);
  }, [trip]);


  if (!encodedData || !trip) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="bg-white border border-[#d7e4dc] rounded-2xl p-8 text-center max-w-md">
          <p className="text-kharcha-navy font-bold text-lg mb-4">{t('auditInvalidShareLink' as any)}</p>
          <p className="text-gray-600 mb-6">{t('auditShareLinkExpired' as any)}</p>
          <Button
            onClick={() => navigate('/')}
            className="bg-kharcha-navy text-white font-bold rounded-full"
          >
            <ArrowLeft className="mr-2" size={18} />
            {t('auditBackToHome' as any)}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <SharedTripViewOnlyHeader
        tripName={trip.name}
        onBack={() => navigate('/')}
        onCopy={async () => {
          const copied = await copyToClipboard(window.location.href);
          if (copied) toast.success(t('auditTripLinkCopied' as any));
          else toast.error(t('auditCouldNotCopyTripLink' as any));
        }}
      />

      {/* Trip Info */}
      <div className="p-4 space-y-4">
        {trip.description && (
          <Card className="bg-white border border-[#d7e4dc] rounded-xl p-4">
            <p className="text-sm text-gray-700">{trip.description}</p>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="grid w-full grid-cols-3 border border-[#d7e4dc] rounded-xl bg-white">
            <TabsTrigger value="expenses" className="font-bold">{t('auditExpensesTab' as any)}</TabsTrigger>
            <TabsTrigger value="dashboard" className="font-bold">{t('auditDashboardTab' as any)}</TabsTrigger>
            <TabsTrigger value="settle" className="font-bold">{t('auditSettlementTab' as any)}</TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-3 mt-4">
            {trip.expenses.length === 0 ? (
              <Card className="bg-white border border-[#d7e4dc] rounded-xl p-6 text-center">
                <p className="text-gray-600 font-semibold">{t('auditNoExpenses' as any)}</p>
              </Card>
            ) : (
              trip.expenses.map(expense => {
                const categoryInfo = getCategoryInfo(expense.category);
                const Icon = categoryInfo.icon;
                const paidByMember = trip.members.find(m => m.id === expense.paidBy);

                return (
                  <Card key={expense.id} className="bg-white border border-[#d7e4dc] rounded-xl p-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-white rounded-xl p-2">
                        <Icon size={20} className="text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-kharcha-navy">{expense.description}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {t('auditPaidBy' as any)} {paidByMember?.name || t('auditUnknown' as any)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatSharedViewDate(expense.date, language)}
                            </p>
                          </div>
                          <p className="font-black text-lg text-blue-600">
                            {formatCurrency(expense.amount)}
                          </p>
                        </div>

                        {/* Split Details */}
                        <div className="mt-3 bg-gray-50 rounded p-2">
                          <p className="text-xs font-semibold text-gray-700 mb-2">{t('auditSplit' as any)}:</p>
                          <div className="space-y-1">
                            {Object.entries(expense.splits).map(([memberId, amount]) => {
                              const member = trip.members.find(m => m.id === memberId);
                              return (
                                <div key={memberId} className="flex justify-between text-xs">
                                  <span className="text-gray-600">{member?.name || t('auditUnknown' as any)}</span>
                                  <span className="font-semibold">{formatCurrency(amount as number)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-4">
            {summary && <DashboardView trip={trip} summary={summary} />}
          </TabsContent>

          {/* Settlement Tab */}
          <TabsContent value="settle" className="mt-4">
            {summary && <SettlementView summary={summary} />}
          </TabsContent>
        </Tabs>

        {/* Members List */}
        <Card className="bg-white border border-[#d7e4dc] rounded-xl p-4 mt-4">
          <p className="font-bold text-kharcha-navy mb-3">{t('auditMembersCount' as any, { count: trip.members.length })}</p>
          <div className="space-y-2">
            {trip.members.map(member => (
              <div key={member.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{member.name}</span>
                <span className="font-semibold text-gray-600">
                  {summary ? formatCurrency(summary.memberOwes[member.id] || 0) : formatCurrency(0)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
