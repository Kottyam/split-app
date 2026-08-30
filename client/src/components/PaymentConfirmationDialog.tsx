import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromMemberName: string;
  toMemberName: string;
  amount: number;
  onMarkPaid: () => void;
  onMarkReceived: () => void;
  onUndo: () => void;
  currentStatus?: 'pending' | 'paid' | 'received';
}

export default function PaymentConfirmationDialog({
  open,
  onOpenChange,
  fromMemberName,
  toMemberName,
  amount,
  onMarkPaid,
  onMarkReceived,
  onUndo,
  currentStatus = 'pending',
}: PaymentConfirmationDialogProps) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-2 border-black rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-black text-black text-xl">
            {t('auditPaymentConfirmation' as any)}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('auditTrackPaymentStatus' as any)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Details */}
          <Card className="bg-white border-2 border-mint-300 rounded-lg p-4">
            <p className="text-xs font-bold text-gray-700 mb-2">{t('auditPaymentDetails' as any)}</p>
            <p className="font-bold text-black mb-1">{fromMemberName}</p>
            <p className="text-xs text-gray-600 mb-3">{t('auditPaysTo' as any)}</p>
            <p className="font-bold text-black mb-3">{toMemberName}</p>
            <p className="text-2xl font-black text-green-600">₹{amount.toFixed(2)}</p>
          </Card>

          {/* Current Status */}
          <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3">
            <p className="text-xs font-bold text-gray-700 mb-2">{t('auditCurrentStatus' as any)}</p>
            <div className="flex items-center gap-2">
              {currentStatus === 'pending' && (
                <>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <p className="font-semibold text-gray-700">{t('auditPending' as any)}</p>
                </>
              )}
              {currentStatus === 'paid' && (
                <>
                  <CheckCircle size={16} className="text-blue-600" />
                  <p className="font-semibold text-blue-700">{t('auditMarkedPaidSender' as any)}</p>
                </>
              )}
              {currentStatus === 'received' && (
                <>
                  <CheckCircle size={16} className="text-green-600" />
                  <p className="font-semibold text-green-700">{t('auditMarkedReceived' as any)}</p>
                </>
              )}
            </div>
          </div>

          {/* Info Box */}
          <Card className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
            <p className="text-xs text-blue-700 font-semibold">
              ℹ️ {t('auditConfirmOtherPerson' as any)}
            </p>
          </Card>
        </div>

        <DialogFooter className="gap-2 flex-col">
          {currentStatus === 'pending' && (
            <>
              <Button
                onClick={onMarkPaid}
                className="w-full bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
              >
                {t('auditMarkAsPaid' as any)}
              </Button>
              <Button
                onClick={onMarkReceived}
                className="w-full bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
              >
                {t('auditMarkAsReceived' as any)}
              </Button>
            </>
          )}
          {(currentStatus === 'paid' || currentStatus === 'received') && (
            <Button
              onClick={onUndo}
              variant="outline"
              className="w-full border-2 border-red-500 text-red-600 font-bold rounded-lg hover:bg-red-50"
            >
              <XCircle size={16} className="mr-2" />
              {t('auditUndoStatus' as any)}
            </Button>
          )}
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="w-full border-2 border-black font-bold rounded-lg"
          >
            {t('auditClose' as any)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
