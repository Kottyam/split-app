import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { nanoid } from 'nanoid';
import type { SharedHomeRoom } from '@/sharedHome/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: SharedHomeRoom;
  onSave: (room: SharedHomeRoom) => void;
}

export default function SharedHomeRoomDialog({ open, onOpenChange, initial, onSave }: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [defaultRent, setDefaultRent] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setDefaultRent(initial?.defaultRent ? String(initial.defaultRent) : '');
    setNotes(initial?.notes ?? '');
    setError('');
  }, [open, initial]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(t('sharedHomeRequiredMessage', { field: t('sharedHomeName') }));
      return;
    }
    onSave({
      id: initial?.id ?? nanoid(),
      name: name.trim(),
      defaultRent: defaultRent ? Number(defaultRent) : undefined,
      notes: notes.trim() || undefined,
      memberIds: initial?.memberIds ?? [],
      createdAt: initial?.createdAt ?? Date.now(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-2 border-[#16834b] rounded-2xl">
        <DialogHeader><DialogTitle className="text-xl font-black text-kharcha-navy">{initial ? `${t('edit')} ${t('sharedHomeRooms')}` : t('sharedHomeAddRoom')}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="home-room-name">{t('sharedHomeName')} *</Label><Input id="home-room-name" value={name} onChange={event => setName(event.target.value)} placeholder={t('sharedHomeRoomNamePlaceholder')} autoFocus /></div>
          <div className="space-y-2"><Label htmlFor="home-room-rent">{t('sharedHomeDefaultRent')}</Label><Input id="home-room-rent" type="number" min="0" step="0.01" value={defaultRent} onChange={event => setDefaultRent(event.target.value)} placeholder={t('sharedHomeOptionalPlaceholder')} /></div>
          <div className="space-y-2"><Label htmlFor="home-room-notes">{t('sharedHomeRoomNotes')}</Label><Textarea id="home-room-notes" value={notes} onChange={event => setNotes(event.target.value)} placeholder={t('sharedHomeOptionalPlaceholder')} rows={3} /></div>
          {error && <p className="text-sm font-semibold text-red-600" role="alert">{error}</p>}
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button><Button type="submit" className="bg-[#16834b] text-white hover:bg-[#11663b]">{t('sharedHomeSave')}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
