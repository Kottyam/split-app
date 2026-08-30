import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, ScanLine } from 'lucide-react';
import { Trip } from '@/types';
import { isValidUpiId, launchUpiPayment } from '@/lib/upi';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface ScanPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip;
}

export default function ScanPayDialog({ open, onOpenChange, trip }: ScanPayDialogProps) {
  const { t } = useLanguage();
  const firstMember = useMemo(() => trip.members.find(member => isValidUpiId(member.upiId)), [trip.members]);
  const [memberId, setMemberId] = useState(firstMember?.id || '');
  const [amount, setAmount] = useState('');

  const selectedMember = trip.members.find(member => member.id === memberId);

  const handleOpen = () => {
    const value = Number(amount);
    if (!selectedMember || !isValidUpiId(selectedMember.upiId) || !Number.isFinite(value) || value <= 0) {
      toast.error(t('auditChooseUpiMember' as any));
      return;
    }
    launchUpiPayment(selectedMember.upiId, value, selectedMember.name, trip.name);
    toast.success(t('auditUpiOpeningConfirm' as any));
    onOpenChange(false);
    setAmount('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-2 border-black rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-black text-black flex items-center gap-2"><ScanLine size={20} />{t('auditScanPay' as any)}</DialogTitle>
          <DialogDescription className="text-gray-600">{t('auditScanPayDescription' as any)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="font-bold text-black">{t('auditPayTo' as any)}</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger className="border-2 border-black rounded-lg mt-1"><SelectValue placeholder={t('auditChooseMember' as any)} /></SelectTrigger>
              <SelectContent>
                {trip.members.map(member => (
                  <SelectItem key={member.id} value={member.id} disabled={!isValidUpiId(member.upiId)}>
                    {member.name}{isValidUpiId(member.upiId) ? '' : ` · ${t('auditNoUpiMember' as any)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="scan-pay-amount" className="font-bold text-black">{t('auditAmountRupees' as any)}</Label>
            <Input id="scan-pay-amount" type="number" min="1" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" className="border-2 border-black rounded-lg mt-1" />
          </div>
          <p className="text-xs text-gray-600">{t('auditUpiBrowserWarning' as any)}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-2 border-black rounded-lg">{t('auditCancel' as any)}</Button>
          <Button onClick={handleOpen} className="bg-black text-white font-bold rounded-lg"><CreditCard size={16} className="mr-2" /> {t('auditOpenUpiApp' as any)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
