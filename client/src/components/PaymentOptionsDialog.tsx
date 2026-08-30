import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { CreditCard, Share2 } from 'lucide-react';

interface PaymentOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenUpiApp: () => void;
  onSharePaymentLink: () => void;
  memberName: string;
  amount: string;
}

export function PaymentOptionsDialogView({
  onOpenChange,
  onOpenUpiApp,
  onSharePaymentLink,
  memberName,
  amount,
}: Omit<PaymentOptionsDialogProps, 'open'>) {
  const { t } = useLanguage();

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-black font-bold text-lg">
          {t('payTo', { amount, name: memberName })}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-3 py-4">
        <Button
          onClick={() => {
            onOpenUpiApp();
            onOpenChange(false);
          }}
          className="w-full bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 text-sm px-4 py-3 flex items-center justify-center gap-2"
        >
          <CreditCard size={18} />
          {t('openUpiApp')}
        </Button>

        <Button
          onClick={() => {
            onSharePaymentLink();
            onOpenChange(false);
          }}
          className="w-full bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 text-sm px-4 py-3 flex items-center justify-center gap-2"
        >
          <Share2 size={18} />
          {t('sharePaymentLink')}
        </Button>

        <Button
          onClick={() => onOpenChange(false)}
          className="w-full bg-gray-300 text-black font-bold rounded-lg hover:bg-gray-400 text-sm px-4 py-3"
        >
          {t('cancel')}
        </Button>
      </div>
    </>
  );
}

export default function PaymentOptionsDialog(props: PaymentOptionsDialogProps) {
  const { open, onOpenChange, onOpenUpiApp, onSharePaymentLink, memberName, amount } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm rounded-lg border-2 border-black bg-white">
        <PaymentOptionsDialogView
          onOpenChange={onOpenChange}
          onOpenUpiApp={onOpenUpiApp}
          onSharePaymentLink={onSharePaymentLink}
          memberName={memberName}
          amount={amount}
        />
      </DialogContent>
    </Dialog>
  );
}
