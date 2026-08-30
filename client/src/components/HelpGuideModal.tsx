import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { HelpCircle, Mail } from 'lucide-react';
import { getSupportEmail, isValidSupportEmail } from '@/lib/supportEmail';
import LanguageSelector from '@/components/LanguageSelector';
import { getHelpGuideCopy } from '@/lib/helpGuideContent';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showLanguageSelector?: boolean;
}

export default function HelpGuideModal({ open, onOpenChange, showLanguageSelector = false }: Props) {
  const { t, language } = useLanguage();
  const copy = getHelpGuideCopy(language);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border-2 border-[#16834b] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 font-black text-kharcha-navy">
              <HelpCircle className="text-[#e87817]" size={20} />
              {copy.title}
            </DialogTitle>
            {showLanguageSelector && <div className="w-36"><LanguageSelector /></div>}
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm font-bold leading-relaxed text-gray-600">{copy.subtitle}</p>
          <div className="space-y-3">
            {copy.sections.map((section, index) => (
              <section key={section.id} className="rounded-2xl border-2 border-[#d7e4dc] bg-[#fffaf3] p-4 shadow-sm">
                <h3 className="text-base font-black text-kharcha-navy">{index + 1}. {section.title}</h3>
                <div className="mt-2 space-y-2 text-sm leading-relaxed text-gray-700">
                  {section.paragraphs.map((paragraph, paragraphIndex) => <p key={`${section.id}-${paragraphIndex}`}>{paragraph}</p>)}
                </div>
              </section>
            ))}
          </div>

          <div className="rounded-2xl border-2 border-[#e87817]/40 bg-[#fff3e3] p-4">
            <p className="text-sm font-black leading-relaxed text-kharcha-navy">{copy.backupWarning}</p>
          </div>

          {(() => {
            const currentEmail = getSupportEmail();
            if (!currentEmail || !isValidSupportEmail(currentEmail)) return null;
            return (
              <div className="rounded-2xl border-2 border-[#d7e4dc] bg-[#dff1e5] p-4 text-center">
                <p className="text-xs font-black uppercase tracking-wider text-[#16834b]">{t('needHelp')}</p>
                <p className="mt-1 text-xs font-bold text-gray-700">{t('emailUsAt')}</p>
                <a href={`mailto:${currentEmail}`} className="mt-1 inline-flex items-center gap-1.5 text-sm font-black text-[#2563eb] underline hover:text-blue-800">
                  <Mail size={15} /> {currentEmail}
                </a>
              </div>
            );
          })()}

          <Button onClick={() => onOpenChange(false)} className="w-full rounded-xl bg-[#16834b] py-5 font-black text-white hover:bg-[#126b3c]">
            {copy.gotIt} / {copy.continue}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
