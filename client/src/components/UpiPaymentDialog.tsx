import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
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

interface UpiPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromMemberName: string;
  toMemberName: string;
  amount: number;
  onConfirmPaid: () => void;
  onCancel: () => void;
}

export default function UpiPaymentDialog({
  open,
  onOpenChange,
  fromMemberName,
  toMemberName,
  amount,
  onConfirmPaid,
  onCancel,
}: UpiPaymentDialogProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-2 border-black rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-black text-black text-xl">
            {t('paymentCompleteQuestion')}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('confirmPayment')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Summary */}
          <Card className="bg-white border-2 border-green-300 rounded-lg p-4">
            <p className="text-xs font-bold text-green-700 mb-3">{t('paymentDetails')}</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-700">{t('from')}</p>
                <p className="font-bold text-black">{fromMemberName}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-700">{t('to')}</p>
                <p className="font-bold text-black">{toMemberName}</p>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-green-200">
                <p className="text-sm font-bold text-gray-700">{t('amountLabel')}</p>
                <p className="text-2xl font-black text-green-600">₹{amount.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          {/* Info */}
          <Card className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
            <p className="text-xs text-blue-700 font-semibold">
              {t('onlyConfirm')}
            </p>
          </Card>
        </div>

        <DialogFooter className="gap-2 flex-col">
          <Button
            onClick={onConfirmPaid}
            className="w-full bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            {t('yesPaid')}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="w-full border-2 border-red-500 text-red-600 font-bold rounded-lg hover:bg-red-50 flex items-center justify-center gap-2"
          >
            <XCircle size={18} />
            {t('noCancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
