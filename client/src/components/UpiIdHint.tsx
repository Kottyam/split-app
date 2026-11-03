import { checkUpiId } from '@/lib/upiLink';

/** Inline warning shown under UPI ID inputs when a phone number or malformed ID is typed. */
export default function UpiIdHint({ value }: { value?: string }) {
  if (!value || !value.trim()) return null;
  const check = checkUpiId(value);
  if (check.ok) return null;
  const msg = check.reason === 'phone'
    ? 'A phone number alone will not work in UPI links. Enter the full UPI ID, e.g. 9876543210@ybl or 9876543210@paytm.'
    : 'This does not look like a UPI ID. Use the format name@bank, e.g. amal@okaxis.';
  return <p role="alert" className="mt-1 text-xs font-bold text-red-600">{msg}</p>;
}
