import { IndianRupee } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { buildUpiPayLink, buildUpiQrUrl } from '@/share/origin';

export interface SharedUpiPayee { name: string; upiId: string; amount?: number; note?: string }

/** Read-only UPI pay links and QR codes for shared pages; renders nothing when no UPI ID is set. */
export default function SharedUpiPayCard({ payees, accent = 'green' }: { payees: SharedUpiPayee[]; accent?: 'green' | 'orange' }) {
  const { t } = useLanguage();
  const list = payees.filter(p => p.upiId && p.upiId.includes('@'));
  if (list.length === 0) return null;
  const color = accent === 'green' ? '#038f27' : '#fd6d00';
  return (
    <Card className="overflow-hidden rounded-3xl border border-[#d7e4f3] bg-white p-0 shadow-md">
      <div className="h-1.5" style={{ background: color }} />
      <div className="space-y-3 p-4">
        <p className="flex items-center gap-2 text-base font-black text-[#023b81]"><IndianRupee size={18} style={{ color }} />{t('auditPayWithUpi' as any)}</p>
        {list.map(p => {
          const link = buildUpiPayLink(p.upiId, p.name, p.amount, p.note);
          return (
            <div key={`${p.name}-${p.upiId}`} className="flex items-center gap-3 rounded-2xl border border-[#e3ecf7] bg-[#f7faff] p-3">
              <img src={buildUpiQrUrl(link, 120)} alt={`UPI QR ${p.name}`} width={88} height={88} className="h-[88px] w-[88px] shrink-0 rounded-xl border bg-white p-1" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-black text-[#023b81]">{p.name}</p>
                <p className="truncate text-xs font-semibold text-gray-600">{p.upiId}</p>
                <a href={link} className="mt-2 inline-flex min-h-10 items-center rounded-2xl px-4 text-sm font-black text-white shadow-md active:scale-[0.97]" style={{ background: color }}>{t('auditPayNowUpi' as any)}</a>
              </div>
            </div>
          );
        })}
        <p className="text-xs text-gray-500">{t('auditScanAnyUpi' as any)}</p>
      </div>
    </Card>
  );
}
