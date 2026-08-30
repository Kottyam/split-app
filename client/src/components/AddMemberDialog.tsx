import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';
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
import { Trip } from '@/types';
import { useTrips } from '@/hooks/useTrips';
import { pickContact, pickMultipleContacts, formatPhoneNumber, isContactPickerSupported, type ContactInfo } from '@/lib/contacts';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip;
}

export default function AddMemberDialog({
  open,
  onOpenChange,
  trip,
}: AddMemberDialogProps) {
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isPickingContact, setIsPickingContact] = useState(false);
  const [pickedContacts, setPickedContacts] = useState<(ContactInfo & { selected: boolean })[]>([]);
  const [showMultiPicker, setShowMultiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const { addMember } = useTrips();
  const { t } = useLanguage();

  const handlePickContact = async () => {
    if (!isContactPickerSupported()) {
      toast.error(t('failedContact'));
      return;
    }
    setIsPickingContact(true);
    try {
      const contacts = await pickMultipleContacts();
      if (contacts && contacts.length > 0) {
        if (contacts.length === 1) {
          if (contacts[0].name) setName(contacts[0].name);
          if (contacts[0].tel) setMobileNumber(formatPhoneNumber(contacts[0].tel));
          setShowManualEntry(true);
          toast.success(t('contactImported'));
        } else {
          setPickedContacts(contacts.map(c => ({ ...c, selected: true })));
          setShowMultiPicker(true);
        }
      }
    } catch (error) {
      toast.error(t('failedContact'));
    } finally {
      setIsPickingContact(false);
    }
  };

  const handleAddSelectedContacts = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const selected = pickedContacts.filter(c => c.selected && c.name?.trim());
    let addedCount = 0;
    const existingNames = new Set(trip.members.map(m => m.name.toLowerCase()));

    for (const contact of selected) {
      const memberName = contact.name!.trim();
      if (!existingNames.has(memberName.toLowerCase())) {
        addMember(
          trip.id,
          memberName,
          contact.tel ? formatPhoneNumber(contact.tel) : undefined,
          undefined
        );
        existingNames.add(memberName.toLowerCase());
        addedCount++;
      }
    }

    if (addedCount > 0) {
      toast.success(t('auditMembersAdded' as any, { count: addedCount }));
    } else {
      toast.info(t('auditNoNewContacts' as any));
    }
    setShowMultiPicker(false);
    setPickedContacts([]);
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (name.trim()) {
      addMember(
        trip.id,
        name.trim(),
        mobileNumber.trim() || undefined,
        upiId.trim() || undefined
      );
      setName('');
      setMobileNumber('');
      setUpiId('');
      setIsSubmitting(false);
      onOpenChange(false);
    } else {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-2 border-black rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-black text-black text-xl">{t('addMember')}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {showMultiPicker ? (t('auditSelectContactsToAdd' as any)) : t('addMemberDetails')}
          </DialogDescription>
        </DialogHeader>

        {showMultiPicker ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm font-bold text-gray-700">
              <span>{t('auditContactsSelected' as any, { count: pickedContacts.filter(c => c.selected).length })}</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPickedContacts(prev => prev.map(c => ({ ...c, selected: true })))}
                  className="border border-black rounded-md text-xs"
                >
                  {t('auditSelectAll' as any)}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPickedContacts(prev => prev.map(c => ({ ...c, selected: false })))}
                  className="border border-black rounded-md text-xs"
                >
                  {t('auditClearAll' as any)}
                </Button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 border-2 border-black rounded-xl p-2 bg-gray-50">
              {pickedContacts.map((contact, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-gray-200">
                  <Checkbox
                    checked={contact.selected}
                    onCheckedChange={(checked) => {
                      setPickedContacts(prev => prev.map((c, i) => i === idx ? { ...c, selected: !!checked } : c));
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-black truncate">{contact.name || t('auditUnnamedContact' as any)}</p>
                    <p className="text-xs text-gray-500 truncate">{contact.tel || contact.email || t('auditNoPhoneEmail' as any)}</p>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMultiPicker(false)}
                className="border-2 border-black rounded-xl font-bold"
              >
                {t('cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleAddSelectedContacts}
                disabled={isSubmitting}
                className="bg-kharcha-green text-white border-2 border-black rounded-xl font-bold hover:bg-green-700"
              >
                {t('auditAddSelected' as any, { count: pickedContacts.filter(c => c.selected).length })}
              </Button>
            </DialogFooter>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Add from Contacts Button */}
          <Button
            type="button"
            onClick={handlePickContact}
            disabled={isPickingContact}
            className="w-full bg-kharcha-green text-white font-bold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
          >
            {isPickingContact && <Loader2 size={16} className="animate-spin" />}
            {isPickingContact ? t('picking') : t('addFromContacts')}
          </Button>

          <Button
            type="button"
            onClick={() => setShowManualEntry(true)}
            className="w-full min-h-11 bg-kharcha-saffron text-kharcha-navy font-bold rounded-lg hover:brightness-95"
          >
            {t('addManually')}
          </Button>

          {showManualEntry && (
          <div>
            <Label htmlFor="member-name" className="font-bold text-black">
              {t('memberNameRequired')}
            </Label>
            <Input
              id="member-name"
              placeholder={t('auditMemberNamePlaceholder' as any)}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-2 border-black rounded-lg mt-1"
              autoFocus
              required
            />

          <div>
            <Label htmlFor="mobile-number" className="font-bold text-black">
              {t('mobileOptional')}
            </Label>
            <Input
              id="mobile-number"
              placeholder={t('auditMobilePlaceholder' as any)}
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="border-2 border-black rounded-lg mt-1"
              maxLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">{t('auditForUpiSharing' as any)}</p>
          </div>

          <div>
            <Label htmlFor="upi-id" className="font-bold text-black">
              {t('upiOptional')}
            </Label>
            <Input
              id="upi-id"
              placeholder={t('auditUpiPlaceholder' as any)}
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="border-2 border-black rounded-lg mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('auditUpiExamples' as any)}
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setName('');
                setMobileNumber('');
                setUpiId('');
                onOpenChange(false);
              }}
              className="border-2 border-black font-bold rounded-lg"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white font-bold rounded-lg hover:bg-gray-800 disabled:cursor-wait disabled:opacity-70"
            >
              {t('addMember')}
            </Button>
          </DialogFooter>
          </div>
          )}
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
