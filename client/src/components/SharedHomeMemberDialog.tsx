import React, { useEffect, useState } from 'react';
import { ContactRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { pickMultipleContacts, formatPhoneNumber, type ContactInfo } from '@/lib/contacts';
import { nanoid } from 'nanoid';
import type { SharedHomeMember } from '@/sharedHome/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { isValidUpiId } from '@/lib/upi';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: SharedHomeMember;
  onSave: (member: SharedHomeMember) => void;
  onSaveMultiple?: (members: SharedHomeMember[]) => void;
}

function dateInput(value: number | undefined): string {
  return value ? new Date(value).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

export default function SharedHomeMemberDialog({ open, onOpenChange, initial, onSave, onSaveMultiple }: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [moveInDate, setMoveInDate] = useState(dateInput(undefined));
  const [moveOutDate, setMoveOutDate] = useState('');
  const [pauseFrom, setPauseFrom] = useState('');
  const [pauseTo, setPauseTo] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [pickedContacts, setPickedContacts] = useState<(ContactInfo & { selected: boolean })[]>([]);
  const [showMultiPicker, setShowMultiPicker] = useState(false);
  const [isPickingContact, setIsPickingContact] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setMobileNumber(initial?.mobileNumber ?? '');
    setUpiId(initial?.upiId ?? '');
    setEmail(initial?.email ?? '');
    setAvatar(initial?.avatar ?? '');
    setMoveInDate(dateInput(initial?.moveInDate));
    setMoveOutDate(initial?.moveOutDate ? dateInput(initial.moveOutDate) : '');
    setPauseFrom(initial?.pausePeriods?.[0]?.startDate ? dateInput(initial.pausePeriods[0].startDate) : '');
    setPauseTo(initial?.pausePeriods?.[0]?.endDate ? dateInput(initial.pausePeriods[0].endDate) : '');
    setIsActive(initial?.isActive ?? true);
    setError('');
    setShowMultiPicker(false);
    setPickedContacts([]);
  }, [open, initial]);

  const handleContact = async () => {
    if (isPickingContact) return;
    setIsPickingContact(true);
    try {
      const contacts = await pickMultipleContacts();
      if (contacts && contacts.length > 0) {
        if (contacts.length === 1) {
          setName(contacts[0].name ?? '');
          setMobileNumber(contacts[0].tel ? formatPhoneNumber(contacts[0].tel) : '');
          toast.success(t('contactImported'));
        } else {
          setPickedContacts(contacts.map(c => ({ ...c, selected: true })));
          setShowMultiPicker(true);
        }
      }
    } catch {
      setError(t('failedContact'));
    } finally {
      setIsPickingContact(false);
    }
  };

  const handleAddSelectedContacts = () => {
    const selected = pickedContacts.filter(c => c.selected && c.name?.trim());
    if (selected.length === 0) {
      setError(t('auditContactsAtLeastOne' as any));
      return;
    }
    const moveIn = new Date(`${moveInDate}T00:00:00Z`).getTime();
    const newMembers: SharedHomeMember[] = selected.map(c => ({
      id: nanoid(),
      name: c.name!.trim(),
      mobileNumber: c.tel ? formatPhoneNumber(c.tel) : '',
      moveInDate: moveIn,
      isActive: true,
      roomAssignments: [],
      createdAt: Date.now(),
    }));

    if (onSaveMultiple) {
      onSaveMultiple(newMembers);
    } else {
      newMembers.forEach(m => onSave(m));
    }
    toast.success(t('auditMembersAdded' as any, { count: newMembers.length }));
    setShowMultiPicker(false);
    onOpenChange(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(t('sharedHomeInvalidExpense'));
      return;
    }
    if (upiId.trim() && !isValidUpiId(upiId)) {
      setError(t('sharedHomeInvalidUpiId'));
      return;
    }
    const moveIn = new Date(`${moveInDate}T00:00:00Z`).getTime();
    const moveOut = moveOutDate ? new Date(`${moveOutDate}T00:00:00Z`).getTime() : undefined;
    const pauseStart = pauseFrom ? new Date(`${pauseFrom}T00:00:00Z`).getTime() : undefined;
    const pauseEnd = pauseTo ? new Date(`${pauseTo}T00:00:00Z`).getTime() : undefined;
    if (moveOut !== undefined && moveOut < moveIn) {
      setError(`${t('sharedHomeMoveOut')} · ${t('sharedHomeMoveIn')}`);
      return;
    }
    if (pauseStart !== undefined && pauseEnd !== undefined && pauseEnd < pauseStart) {
      setError(`${t('pbPauseTo' as any)} · ${t('pbPauseFrom' as any)}`);
      return;
    }
    if (pauseStart !== undefined && pauseStart < moveIn) {
      setError(`${t('pbPauseFrom' as any)} · ${t('sharedHomeMoveIn')}`);
      return;
    }
    if (pauseEnd !== undefined && moveOut !== undefined && pauseEnd > moveOut) {
      setError(`${t('pbPauseTo' as any)} · ${t('sharedHomeMoveOut')}`);
      return;
    }
    onSave({
      id: initial?.id ?? nanoid(),
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      upiId: upiId.trim() || undefined,
      email: email.trim() || undefined,
      avatar: avatar.trim() || undefined,
      moveInDate: moveIn,
      moveOutDate: moveOut,
      pausePeriods: pauseStart !== undefined ? [{ startDate: pauseStart, ...(pauseEnd !== undefined ? { endDate: pauseEnd } : {}) }] : initial?.pausePeriods,
      isActive,
      roomAssignments: initial?.roomAssignments ?? [],
      createdAt: initial?.createdAt ?? Date.now(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-2 border-[#16834b] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-xl font-black text-kharcha-navy">{initial ? `${t('edit')} ${t('sharedHomeMembers')}` : t('sharedHomeAddMember')}</DialogTitle></DialogHeader>
        {showMultiPicker ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm font-bold text-gray-700">
              <span>{pickedContacts.filter(c => c.selected).length} {t('auditContactsSelected' as any)}</span>
              <div className="space-x-2">
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

            <div className="max-h-60 overflow-y-auto space-y-2 border-2 border-[#16834b] rounded-xl p-2 bg-gray-50">
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
                className="bg-[#16834b] text-white border-2 border-black rounded-xl font-bold hover:bg-[#11663b]"
              >
                {t('auditAddSelected' as any, { count: pickedContacts.filter(c => c.selected).length })}
              </Button>
            </DialogFooter>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Button type="button" variant="outline" onClick={handleContact} disabled={isPickingContact} className="w-full border-[#16834b] text-[#11663b] disabled:cursor-wait disabled:opacity-70">
            {isPickingContact ? <Loader2 className="mr-2 animate-spin" size={18} /> : <ContactRound className="mr-2" size={18} />}
            {isPickingContact ? t('picking') : t('addFromContacts')}
          </Button>
          <div className="space-y-2"><Label htmlFor="home-member-name">{t('sharedHomeMemberName')} *</Label><Input id="home-member-name" value={name} onChange={event => setName(event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="home-member-mobile">{t('sharedHomeMobile')}</Label><Input id="home-member-mobile" type="tel" value={mobileNumber} onChange={event => setMobileNumber(event.target.value)} placeholder={t('sharedHomeMobileOptional')} /></div>
          <div className="space-y-2"><Label htmlFor="home-member-upi">{t('sharedHomeUpiId')}</Label><Input id="home-member-upi" value={upiId} onChange={event => setUpiId(event.target.value)} placeholder={t('sharedHomeUpiIdPlaceholder')} /></div>
          <div className="space-y-2"><Label htmlFor="home-member-email">{t('sharedHomeEmail')}</Label><Input id="home-member-email" type="email" value={email} onChange={event => setEmail(event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="home-member-avatar">{t('sharedHomeAvatar')}</Label><Input id="home-member-avatar" value={avatar} onChange={event => setAvatar(event.target.value)} placeholder={t('sharedHomeAvatarPlaceholder')} /></div>
          <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="home-member-move-in">{t('sharedHomeMoveIn')}</Label><Input id="home-member-move-in" type="date" value={moveInDate} onChange={event => setMoveInDate(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="home-member-move-out">{t('sharedHomeMoveOut')}</Label><Input id="home-member-move-out" type="date" value={moveOutDate} onChange={event => setMoveOutDate(event.target.value)} /></div></div><div className="space-y-2 rounded-xl bg-[#fffaf3] p-3"><p className="text-xs font-bold text-gray-600">{t('pbPause' as any)} ({t('sharedHomeOptional')})</p><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="home-member-pause-from">{t('pbPauseFrom' as any)}</Label><Input id="home-member-pause-from" type="date" value={pauseFrom} onChange={event => setPauseFrom(event.target.value)} /></div><div className="space-y-1"><Label htmlFor="home-member-pause-to">{t('pbPauseTo' as any)}</Label><Input id="home-member-pause-to" type="date" value={pauseTo} onChange={event => setPauseTo(event.target.value)} /></div></div></div>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={isActive} onChange={event => setIsActive(event.target.checked)} />{t('sharedHomeActive')}</label>
          {error && <p className="text-sm font-semibold text-red-600" role="alert">{error}</p>}
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button><Button type="submit" className="bg-[#16834b] text-white hover:bg-[#11663b]">{t('sharedHomeSave')}</Button></DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
