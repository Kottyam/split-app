import React from 'react';
import { Home as HomeIcon, Plane, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTrip: () => void;
  onSharedHome: () => void;
}

export default function CreateModeDialog({ open, onOpenChange, onTrip, onSharedHome }: Props) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white border-2 border-[#e87817] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-kharcha-navy">{t('sharedHomeCreate')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full h-auto justify-between rounded-2xl border-2 border-[#e87817] bg-[#fffaf3] px-4 py-4 text-left hover:bg-[#fff1df]"
            onClick={() => { onOpenChange(false); onTrip(); }}
          >
            <span className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f4c7a1] text-xl"><Plane size={21} /></span>
              <span><strong className="block text-base text-kharcha-navy">{t('sharedHomeTripOption')}</strong><span className="text-xs text-gray-600">{t('splitExpenses')}</span></span>
            </span>
            <ArrowRight size={18} />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full h-auto justify-between rounded-2xl border-2 border-[#16834b] bg-[#f2fbf3] px-4 py-4 text-left hover:bg-[#e4f5e7]"
            onClick={() => { onOpenChange(false); onSharedHome(); }}
          >
            <span className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#b9ddc9] text-xl"><HomeIcon size={21} /></span>
              <span><strong className="block text-base text-kharcha-navy">{t('sharedHomeSharedHomeOption')}</strong><span className="text-xs text-gray-600">{t('sharedHomeManagerMode')}</span></span>
            </span>
            <ArrowRight size={18} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
