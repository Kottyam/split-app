import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trip, Member } from '@/types';
import { useTrips } from '@/hooks/useTrips';
import { useLanguage } from '@/contexts/LanguageContext';

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip;
  member: Member | null;
}

export default function EditMemberDialog({
  open,
  onOpenChange,
  trip,
  member,
}: EditMemberDialogProps) {
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const { updateMember } = useTrips();
  const { t } = useLanguage();

  useEffect(() => {
    if (member) {
      setName(member.name);
      setMobileNumber(member.mobileNumber || '');
      setUpiId(member.upiId || '');
    }
  }, [member, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !name.trim()) {
      alert(t('enterMemberName') || 'Please enter a member name');
      return;
    }

    // Check if name already exists (excluding current member)
    const nameExists = trip.members.some(m => m.id !== member.id && m.name.toLowerCase() === name.toLowerCase());
    if (nameExists) {
      alert(t('memberAlreadyExists') || 'A member with this name already exists');
      return;
    }

    updateMember(trip.id, member.id, {
      name: name.trim(),
      mobileNumber: mobileNumber.trim() || undefined,
      upiId: upiId.trim() || undefined,
    });
    onOpenChange(false);
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-2 border-black rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-black text-black text-xl">{t('editMember') || 'Edit Member'}</DialogTitle>
          <DialogDescription className="text-gray-600 text-sm">
            {t('updateMemberName') || "Update the member's name"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="font-bold text-black">
              {t('memberName') || 'Member Name'} *
            </Label>
            <Input
              id="name"
              placeholder={t('enterMemberNamePlaceholder') || 'Enter member name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-2 border-black rounded-lg mt-1"
              autoFocus
              required
            />
          </div>

          <div>
            <Label htmlFor="mobile" className="font-bold text-black">
              {t('mobileNumberOptional') || 'Mobile Number (Optional)'}
            </Label>
            <Input
              id="mobile"
              placeholder={t('tenDigitNumber') || '10-digit number'}
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="border-2 border-black rounded-lg mt-1"
              maxLength={10}
            />
          </div>

          <div>
            <Label htmlFor="upi" className="font-bold text-black">
              {t('upiIdOptional') || 'UPI ID (Optional)'}
            </Label>
            <Input
              id="upi"
              placeholder={t('upiPlaceholder') || 'name@bankcode'}
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="border-2 border-black rounded-lg mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('upiExample') || 'Example: user@okhdfcbank, name@ybl'}
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-2 border-black font-bold rounded-lg"
            >
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              type="submit"
              className="bg-black text-white font-bold rounded-lg hover:bg-gray-800"
            >
              {t('saveChanges') || 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
