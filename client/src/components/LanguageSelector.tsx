import React from 'react';
import { Languages } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSelector() {
  const { language, setLanguage, languages, t } = useLanguage();
  const selected = languages.find(item => item.code === language);

  return (
    <div className="flex items-center gap-1.5" aria-label={t('language')}>
      <Languages size={16} className="text-kharcha-navy shrink-0" aria-hidden="true" />
      <Select value={language} onValueChange={value => setLanguage(value as typeof language)}>
        <SelectTrigger className="h-9 w-[118px] border-2 border-[#16834b] bg-white text-xs font-bold text-kharcha-navy rounded-full px-3">
          <SelectValue>{selected?.nativeLabel ?? 'English'}</SelectValue>
        </SelectTrigger>
        <SelectContent className="border-2 border-black rounded-xl bg-white max-h-80">
          {languages.map(item => (
            <SelectItem key={item.code} value={item.code} className="font-semibold">
              <span className="flex items-center gap-2">
                <span>{item.nativeLabel}</span>
                <span className="text-xs text-gray-500">{item.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
