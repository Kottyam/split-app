import React, { useMemo, useState } from 'react';
import { Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SharedHomeType } from '@/sharedHome/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateHome: (input: {
    name: string;
    homeType: SharedHomeType;
    startDate: number;
    address?: string;
    description?: string;
  }) => void;
}

const homeTypes: Array<{ value: SharedHomeType; key: 'sharedHomeTypeFlat' | 'sharedHomeTypeHouse' | 'sharedHomeTypeHostel' | 'sharedHomeTypePg' | 'sharedHomeTypeSharedRoom' | 'sharedHomeTypeOther' }> = [
  { value: 'flat', key: 'sharedHomeTypeFlat' },
  { value: 'house', key: 'sharedHomeTypeHouse' },
  { value: 'hostel', key: 'sharedHomeTypeHostel' },
  { value: 'pg', key: 'sharedHomeTypePg' },
  { value: 'shared-room', key: 'sharedHomeTypeSharedRoom' },
  { value: 'other', key: 'sharedHomeTypeOther' },
];

function toDateInput(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function fromDateInput(value: string): number {
  return new Date(`${value}T00:00:00Z`).getTime();
}

export default function SharedHomeCreateDialog({ open, onOpenChange, onCreateHome }: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [homeType, setHomeType] = useState<SharedHomeType>('flat');
  const [startDate, setStartDate] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setName('');
    setHomeType('flat');
    setStartDate('');
    setAddress('');
    setDescription('');
    setError('');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(`${t('sharedHomeName')} ${t('sharedHomeRequired')}`);
      return;
    }
    if (!startDate) {
      setError(`${t('sharedHomeStartDate')} ${t('sharedHomeRequired')}`);
      return;
    }
    onCreateHome({
      name,
      homeType,
      startDate: fromDateInput(startDate),
      address,
      description,
    });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) reset(); onOpenChange(nextOpen); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white border-2 border-[#16834b] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-kharcha-navy">
            <HomeIcon className="text-[#16834b]" size={22} />
            {t('sharedHomeCreate')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shared-home-name">{t('sharedHomeName')} *</Label>
            <Input id="shared-home-name" value={name} onChange={event => setName(event.target.value)} placeholder={t('sharedHomeCreateNamePlaceholder')} autoFocus />
          </div>
          <div className="space-y-2">
            <Label>{t('sharedHomeHomeType')}</Label>
            <Select value={homeType} onValueChange={value => setHomeType(value as SharedHomeType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {homeTypes.map(type => <SelectItem key={type.value} value={type.value}>{t(type.key)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shared-home-start-date">{t('sharedHomeStartDate')} *</Label>
            <Input id="shared-home-start-date" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shared-home-address">{t('sharedHomeAddress')}</Label>
            <Input id="shared-home-address" value={address} onChange={event => setAddress(event.target.value)} placeholder={t('sharedHomeOptional')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shared-home-description">{t('sharedHomeDescription')}</Label>
            <Textarea id="shared-home-description" value={description} onChange={event => setDescription(event.target.value)} placeholder={t('sharedHomeOptional')} rows={3} />
          </div>
          {error && <p className="text-sm font-semibold text-red-600" role="alert">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
            <Button type="submit" className="bg-[#16834b] text-white hover:bg-[#11663b]">{t('sharedHomeCreateHome')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
