import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LanguageSelector from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AppSettingsDialog({ open, onOpenChange }: Props) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-2 border-[#16834b] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black text-kharcha-navy">
            <Settings className="text-[#e87817]" size={20} />
            {t('settings')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl bg-[#fffaf3] p-3 border border-[#e7d7bd]">
            <p className="mb-2 text-sm font-bold text-kharcha-navy">{t('language')}</p>
            <LanguageSelector />
          </div>
          <p className="text-xs text-gray-500">{t('languagePersistenceNote')}</p>

          <div className="rounded-xl bg-[#f2fbf3] p-4 border border-[#16834b]/30">
            <h3 className="mb-2 text-sm font-black text-kharcha-navy flex items-center gap-2">
              <span>📖</span> {t('kharchaNotes')}
            </h3>
            <p className="text-xs leading-relaxed text-gray-700">{t('welcomeSubtitle')}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => onOpenChange(false)} className="mt-2 rounded-xl font-bold">{t('close')}</Button>
      </DialogContent>
    </Dialog>
  );
}
