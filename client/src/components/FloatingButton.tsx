import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface FloatingButtonProps {
  onClick: () => void;
}

const TAGLINE_KEYS = ['auditTaglineTravelTogether', 'auditTaglineSplitEasy', 'auditTaglineMemories', 'auditTaglineOneTrip', 'auditTaglineFriendsTogether', 'auditTaglineTravelSmart'] as const;

export default function FloatingButton({ onClick }: FloatingButtonProps) {
  const { t } = useLanguage();
  const taglines = TAGLINE_KEYS.map(key => t(key as any));
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % TAGLINE_KEYS.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-24 right-4 z-30 flex flex-col items-end gap-3">
      {/* Tagline */}
      <div className="bg-white border-2 border-black rounded-full px-4 py-2 shadow-lg animate-fade-in">
        <p className="text-xs font-bold text-black whitespace-nowrap">
          {taglines[taglineIndex]}
        </p>
      </div>

      {/* Button */}
      <Button
        onClick={onClick}
        className="bg-black text-white rounded-full w-14 h-14 p-0 shadow-lg hover:bg-gray-800 hover:scale-110 transition-transform"
        title={t('auditCreateNewTripButton' as any)}
      >
        <Plus size={24} />
      </Button>
    </div>
  );
}
