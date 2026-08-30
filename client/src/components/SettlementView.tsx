import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TripSummary, Trip, Settlement } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight, CreditCard, Check, RotateCcw } from 'lucide-react';
import { launchUpiPayment, sharePaymentRequest, getPaymentMethod } from '@/lib/upi';
import { toast } from 'sonner';
import UpiPaymentDialog from './UpiPaymentDialog';
import PaymentOptionsDialog from './PaymentOptionsDialog';

interface SettlementViewProps {
  summary: TripSummary;
  trip?: Trip;
  onSettlementStatusChange?: (fromId: string, toId: string, status: 'pending' | 'paid' | 'received') => void;
  onQuickExpense?: () => void;
}

export default function SettlementView({ summary, trip, onSettlementStatusChange, onQuickExpense }: SettlementViewProps) {
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [settlementStatus, setSettlementStatus] = useState<Record<string, string>>({});
  const { t } = useLanguage();

  // Load settlement status from localStorage on mount
  useEffect(() => {
    if (!trip) return;
    
    const storageKey = `settlement_status_${trip.id}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettlementStatus(parsed);
        console.log('[Settlement] Loaded status from localStorage:', parsed);
      } catch (error) {
        console.error('[Settlement] Failed to parse stored status:', error);
      }
    }
  }, [trip?.id]);

  // Save settlement status to localStorage whenever it changes
  useEffect(() => {
    if (!trip || Object.keys(settlementStatus).length === 0) return;
    
    const storageKey = `settlement_status_${trip.id}`;
    localStorage.setItem(storageKey, JSON.stringify(settlementStatus));
    console.log('[Settlement] Saved status to localStorage:', settlementStatus);
  }, [settlementStatus, trip?.id]);

  if (summary.settlements.length === 0) {
    return (
      <Card className="bg-white border-2 border-black rounded-lg p-8 text-center">
        <p className="text-gray-600 font-semibold text-lg">{t('allSettled')}</p>
        <p className="text-gray-500 text-sm mt-2">{t('noPaymentsNeeded')}</p>
      </Card>
    );
  }

  const handlePay = (settlement: Settlement) => {
    if (!trip) {
      toast.error('Trip data not available');
      return;
    }

    const receiver = trip.members.find(m => m.id === settlement.toId || m.name === settlement.to);
    if (!receiver || getPaymentMethod(receiver.upiId, receiver.mobileNumber) === 'none') {
      toast.error('Add a UPI ID or a UPI-linked mobile number to the receiving member');
      return;
    }

    try {
      launchUpiPayment(receiver.upiId, settlement.amount, receiver.name, trip.name, receiver.mobileNumber);
      setSelectedSettlement(settlement);
      setShowPaymentOptions(false);
      setShowPaymentConfirmation(true);
      toast.success('Opening payment app… Return to Kharcha to confirm.');
    } catch (error) {
      console.error('[UPI] Failed to open payment:', error);
      toast.error('Could not open payment app');
    }
  };

  const handleSharePaymentLink = async (settlement: Settlement) => {
    if (!trip) {
      toast.error('Trip data not available');
      return;
    }

    const receiver = trip.members.find(m => m.id === settlement.toId || m.name === settlement.to);
    if (!receiver) {
      toast.error('Receiver details are unavailable');
      return;
    }

    const result = await sharePaymentRequest(
      settlement.from,
      receiver.name,
      settlement.amount,
      trip.name,
      receiver.upiId,
      receiver.mobileNumber,
    );
    if (result === 'shared') toast.success('Payment request shared!');
    else if (result === 'copied') toast.success('Payment request copied!');
    else toast.info('Sharing was cancelled');
  };

  const handleConfirmPaid = (settlement: Settlement) => {
    const key = `${settlement.fromId}-${settlement.toId}`;
    const newStatus = { ...settlementStatus, [key]: 'paid' };
    setSettlementStatus(newStatus);
    onSettlementStatusChange?.(settlement.fromId, settlement.toId, 'paid');
    setShowPaymentConfirmation(false);
    onQuickExpense?.();
    toast.success('Payment marked as completed! Add it as an expense if needed.');
  };

  const handleMarkAsPaid = (settlement: Settlement) => {
    const key = `${settlement.fromId}-${settlement.toId}`;
    const newStatus = { ...settlementStatus, [key]: 'paid' };
    setSettlementStatus(newStatus);
    onSettlementStatusChange?.(settlement.fromId, settlement.toId, 'paid');
    toast.success('Payment marked as completed!');
  };

  const handleUndo = (settlement: Settlement) => {
    const key = `${settlement.fromId}-${settlement.toId}`;
    const newStatus = { ...settlementStatus, [key]: 'pending' };
    setSettlementStatus(newStatus);
    onSettlementStatusChange?.(settlement.fromId, settlement.toId, 'pending');
    toast.success('Status reset to pending');
  };

  return (
    <div className="space-y-3">
      <div className="bg-yellow-100 border-2 border-black rounded-lg p-4 mb-4">
        <p className="font-bold text-black text-sm">💡 {t('settlementSummary')}</p>
        <p className="text-xs text-gray-700 mt-2">
          {t('makePayments', { count: summary.settlements.length })}
        </p>
      </div>

      <div className="space-y-2">
        {summary.settlements.map((settlement, idx) => {
          const key = `${settlement.fromId}-${settlement.toId}`;
          const status = settlementStatus[key] || settlement.status || 'pending';
          const isPaid = status === 'paid';

          return (
            <Card
              key={idx}
              className={`border-2 rounded-lg p-4 transition-all ${
                isPaid
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white border-black hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 ${
                    isPaid ? 'bg-green-200' : 'bg-mint-200'
                  }`}>
                    <span className="font-bold text-black text-sm">
                      {settlement.from.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${isPaid ? 'line-through text-gray-500' : 'text-black'}`}>
                      {settlement.from}
                    </p>
                    <p className="text-xs text-gray-600">{t('pays')}</p>
                  </div>
                </div>

                <ArrowRight className="text-black flex-shrink-0 mx-2" size={20} />

                <div className="flex items-center gap-3 flex-1">
                  <div className={`rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 ${
                    isPaid ? 'bg-green-200' : 'bg-lilac-200'
                  }`}>
                    <span className="font-bold text-black text-sm">
                      {settlement.to.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${isPaid ? 'line-through text-gray-500' : 'text-black'}`}>
                      {settlement.to}
                    </p>
                    <p className="text-xs text-gray-600">{t('receives')}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t-2 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <p className={`font-black text-xl ${isPaid ? 'line-through text-gray-400' : 'text-black'}`}>
                    {formatCurrency(settlement.amount)}
                  </p>
                  {isPaid && <Check size={20} className="text-green-600" />}
                </div>

                {/* Action Buttons */}
                {/* Action Buttons */}
                {!isPaid ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedSettlement(settlement);
                        setShowPaymentOptions(true);
                      }}
                      className="flex-1 bg-kharcha-green text-white font-bold rounded-lg hover:brightness-95 text-sm px-3 py-2 flex items-center justify-center gap-2"
                    >
                      <CreditCard size={16} />
                      {t('pay')}
                    </Button>
                    <Button
                      onClick={() => handleMarkAsPaid(settlement)}
                      className="flex-1 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 text-sm px-3 py-2 flex items-center justify-center gap-1"
                      title={t('mark')}
                    >
                      <Check size={16} />
                      {t('mark')}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleUndo(settlement)}
                    className="w-full bg-gray-400 text-white font-bold rounded-lg hover:bg-gray-500 text-sm px-3 py-2 flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={16} />
                    {t('undo')}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary stats - exclude paid settlements */}
      {(() => {
        const pendingSettlements = summary.settlements.filter(s => {
          const key = `${s.fromId}-${s.toId}`;
          const status = settlementStatus[key] || s.status || 'pending';
          return status === 'pending';
        });
        const totalPending = pendingSettlements.reduce((sum, s) => sum + s.amount, 0);
        const totalPaid = summary.settlements.reduce((sum, s) => {
          const key = `${s.fromId}-${s.toId}`;
          const status = settlementStatus[key] || s.status || 'pending';
          return status === 'paid' ? sum + s.amount : sum;
        }, 0);

        return (
          <Card className="bg-white border-2 border-black rounded-lg p-4 mt-6">
            <p className="font-bold text-black mb-3">{t('summary')}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">{t('outstanding')}</span>
                <span className="font-bold text-red-600">
                  {formatCurrency(totalPending)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">{t('paid')}:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(totalPaid)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300">
                <span className="text-gray-700">{t('pendingTransactions')}</span>
                <span className="font-bold text-black">{pendingSettlements.length}</span>
              </div>
            </div>
          </Card>
        );
      })()}

      {/* Payment Options Dialog */}
      {selectedSettlement && (
        <PaymentOptionsDialog
          open={showPaymentOptions}
          onOpenChange={setShowPaymentOptions}
          memberName={selectedSettlement.to}
          amount={selectedSettlement.amount.toFixed(2)}
          onOpenUpiApp={() => handlePay(selectedSettlement)}
          onSharePaymentLink={() => {
            setShowPaymentOptions(false);
            void handleSharePaymentLink(selectedSettlement);
          }}
        />
      )}
      {selectedSettlement && trip && (
        <UpiPaymentDialog
          open={showPaymentConfirmation}
          onOpenChange={setShowPaymentConfirmation}
          fromMemberName={selectedSettlement.from}
          toMemberName={selectedSettlement.to}
          amount={selectedSettlement.amount}
          onConfirmPaid={() => handleConfirmPaid(selectedSettlement)}
          onCancel={() => setShowPaymentConfirmation(false)}
        />
      )}
    </div>
  );
}
