import { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Member } from '@/types';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface ViewMemberDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  tripName: string;
  outstandingAmount: number;
}

export default function ViewMemberDetailsDialog({
  open,
  onOpenChange,
  member,
  tripName,
  outstandingAmount,
}: ViewMemberDetailsDialogProps) {
  const { t } = useLanguage();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!member) return null;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} ${t('auditCopied' as any)}`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error(t('auditCopyFailed' as any));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-2 border-black rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-black text-black text-xl">
            {member.name}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('auditMemberDetailsFor' as any, { trip: tripName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Outstanding Amount */}
          <Card className="bg-white border-2 border-blue-300 rounded-lg p-4">
            <p className="text-xs font-bold text-blue-700 mb-1">{t('auditOutstandingAmount' as any)}</p>
            <p className="text-2xl font-black text-blue-600">
              ₹{outstandingAmount.toFixed(2)}
            </p>
          </Card>

          {/* Member Details */}
          <div className="space-y-3">
            {/* Name */}
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3">
              <p className="text-xs font-bold text-gray-700 mb-2">{t('auditName' as any)}</p>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-black">{member.name}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(member.name, t('auditName' as any))}
                  className="h-8 w-8 p-0"
                >
                  {copiedField === t('auditName' as any) ? (
                    <Check size={16} className="text-green-600" />
                  ) : (
                    <Copy size={16} className="text-gray-600" />
                  )}
                </Button>
              </div>
            </div>

            {/* Mobile Number */}
            {member.mobileNumber && (
              <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3">
                <p className="text-xs font-bold text-gray-700 mb-2">{t('auditMobileNumber' as any)}</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-black">{member.mobileNumber}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(member.mobileNumber!, t('auditMobileNumber' as any))}
                    className="h-8 w-8 p-0"
                  >
                    {copiedField === t('auditMobileNumber' as any) ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <Copy size={16} className="text-gray-600" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* UPI ID */}
            {member.upiId && (
              <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3">
                <p className="text-xs font-bold text-gray-700 mb-2">{t('auditUpiId' as any)}</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-black font-mono text-sm">
                    {member.upiId}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(member.upiId!, t('auditUpiId' as any))}
                    className="h-8 w-8 p-0"
                  >
                    {copiedField === t('auditUpiId' as any) ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <Copy size={16} className="text-gray-600" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* No Payment Details */}
            {!member.mobileNumber && !member.upiId && (
              <Card className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
                <p className="text-xs text-yellow-700 font-semibold">
                  ℹ️ {t('auditNoPaymentDetails' as any)}
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-black text-white font-bold rounded-lg hover:bg-gray-800"
          >
            {t('auditClose' as any)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
