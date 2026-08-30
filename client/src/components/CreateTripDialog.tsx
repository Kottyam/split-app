import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CreateTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTrip: (name: string, description: string, startDate: number, endDate: number) => void;
}

export default function CreateTripDialog({
  open,
  onOpenChange,
  onCreateTrip,
}: CreateTripDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      onCreateTrip(name, description, start, end);
      setName('');
      setDescription('');
      setStartDate('');
      setEndDate('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-2 border-black rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-black text-black text-xl">{t('createNewTrip')}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('startPlanning')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="trip-name" className="font-bold text-black">
              {t('tripName')}
            </Label>
            <Input
              id="trip-name"
              placeholder={t('auditTripNamePlaceholder' as any)}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-2 border-black rounded-lg mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="trip-description" className="font-bold text-black">
              {t('description')}
            </Label>
            <Textarea
              id="trip-description"
              placeholder={t('auditTripDescriptionPlaceholder' as any)}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-2 border-black rounded-lg mt-1 resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date" className="font-bold text-black">
                {t('startDate')}
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-2 border-black rounded-lg mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="end-date" className="font-bold text-black">
                {t('endDate')}
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-2 border-black rounded-lg mt-1"
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-2 border-black font-bold rounded-lg"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-black text-white font-bold rounded-lg hover:bg-gray-800"
            >
              {t('createTrip')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
