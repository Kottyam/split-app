import { checkUpiId } from '@/lib/upiLink';
import { useLanguage } from '@/contexts/LanguageContext';

/** Inline warning shown under UPI ID inputs when a phone number or malformed ID is typed. */
export default function UpiIdHint({ value }: { value?: string }) {
  const { t } = useLanguage();
  if (!value || !value.trim()) return null;
  const check = checkUpiId(value);
  if (check.ok) return null;
  const msg = check.reason === 'phone'
    ? t('upiHintPhone' as any)
    : t('upiHintInvalid' as any);
  return <p role="alert" className="mt-1 text-xs font-bold text-red-600">{msg}</p>;
}
