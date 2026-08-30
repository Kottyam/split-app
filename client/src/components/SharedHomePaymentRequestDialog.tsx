import React, { useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, QrCode, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { copyToClipboard } from '@/lib/shareLink';
import { isValidUpiId } from '@/lib/upi';
import {
  copySharedHomePaymentAmount,
  copySharedHomePaymentRequestLink,
  generateSharedHomePaymentRequestLink,
  generateSharedHomeUpiDeepLink,
  type SharedHomePaymentRequest,
} from '@/sharedHome/paymentRequest';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: SharedHomePaymentRequest;
  onPayViaUpi: () => void;
  onSharePaymentRequest: () => Promise<void>;
}

export default function SharedHomePaymentRequestDialog(props: Props) {
  const { t } = useLanguage();
  return <Dialog open={props.open} onOpenChange={props.onOpenChange}><DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl border-2 border-[#16834b] bg-white"><DialogHeader><DialogTitle>{props.request.payeeName ? t('auditPay' as any, { name: props.request.payeeName }) : t('auditPaymentRequest' as any)}</DialogTitle></DialogHeader><SharedHomePaymentRequestPanel {...props} inDialog /></DialogContent></Dialog>;
}

export function SharedHomePaymentRequestPanel({ request, onPayViaUpi, onSharePaymentRequest, inDialog = false }: Omit<Props, 'open' | 'onOpenChange'> & { inDialog?: boolean }) {
  const { t } = useLanguage();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const normalized = request;
  const upiLink = generateSharedHomeUpiDeepLink(normalized);
  const hasUpi = isValidUpiId(normalized.upiId) && Boolean(upiLink);

  const copy = async (value: string, label: string) => {
    if (await copyToClipboard(value)) {
      setCopied(label);
      window.setTimeout(() => setCopied(current => current === label ? null : current), 1800);
    }
  };

  const toggleQr = async () => {
    if (qrDataUrl) {
      setQrDataUrl(null);
      return;
    }
    if (!upiLink) return;
    try {
      setQrError(false);
      setQrDataUrl(await QRCode.toDataURL(upiLink, { width: 220, margin: 2, errorCorrectionLevel: 'M' }));
    } catch {
      setQrError(true);
    }
  };

  const content = <div className="space-y-4"><Card className="rounded-2xl border-2 border-[#e7d7bd] bg-[#fffaf3] p-4"><p className="text-xs font-black uppercase tracking-wide text-[#e87817]">{t('sharedHomePaymentRequest')}</p><h2 className="mt-1 text-2xl font-black text-kharcha-navy">{t('auditPay' as any, { name: normalized.payeeName })}</h2><p className="mt-2 text-3xl font-black text-[#16834b]">₹{normalized.amount.toFixed(2)}</p><div className="mt-4 space-y-2 text-sm"><div className="flex justify-between gap-3"><span className="font-semibold text-gray-500">{t('sharedHomeWhoPays')}</span><strong className="text-right text-kharcha-navy">{normalized.payerName}</strong></div><div className="flex justify-between gap-3"><span className="font-semibold text-gray-500">{t('sharedHomeWhoReceives')}</span><strong className="text-right text-kharcha-navy">{normalized.payeeName}</strong></div><div className="flex justify-between gap-3"><span className="font-semibold text-gray-500">{t('sharedHomeReason')}</span><strong className="text-right text-kharcha-navy">{normalized.reason}</strong></div>{normalized.upiId && <div className="flex justify-between gap-3"><span className="font-semibold text-gray-500">{t('auditUpiId' as any)}</span><strong className="break-all text-right text-kharcha-navy">{normalized.upiId}</strong></div>}</div></Card>{hasUpi ? <div className="space-y-2"><Button onClick={onPayViaUpi} className="w-full bg-[#16834b] py-6 text-base font-black text-white hover:bg-[#11663b]"><Smartphone className="mr-2" size={18} />{t('sharedHomePayViaUpi')}</Button><p className="text-xs font-semibold text-gray-500">{t('sharedHomePaymentPending')}</p></div> : <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-800">{t('sharedHomeNoUpiPaymentFallback')}</p>}<div className="grid gap-2 sm:grid-cols-2"><Button variant="outline" onClick={onSharePaymentRequest} className="w-full"><Copy className="mr-2" size={16} />{t('sharedHomeSharePaymentRequest')}</Button><Button variant="outline" onClick={async () => { if (await copySharedHomePaymentRequestLink(normalized)) { setCopied('link'); window.setTimeout(() => setCopied(null), 1800); } }} className="w-full"><Copy className="mr-2" size={16} />{copied === 'link' ? t('sharedHomePaymentLinkCopied') : t('sharedHomeCopyPaymentLink')}</Button></div>{hasUpi && <div className="space-y-2 rounded-xl border border-[#c7d8cc] bg-[#f2fbf3] p-3"><p className="text-sm font-bold text-kharcha-navy">{t('sharedHomePaymentFallback')}</p><div className="grid gap-2 sm:grid-cols-2"><Button size="sm" variant="outline" onClick={() => copy(normalized.upiId!, 'upi')}><Copy className="mr-1" size={14} />{copied === 'upi' ? <Check size={14} /> : t('sharedHomeCopyUpi')}</Button><Button size="sm" variant="outline" onClick={() => void copySharedHomePaymentAmount(normalized).then(success => { if (success) { setCopied('amount'); window.setTimeout(() => setCopied(null), 1800); } })}><Copy className="mr-1" size={14} />{copied === 'amount' ? <Check size={14} /> : t('sharedHomeCopyAmount')}</Button><Button size="sm" variant="outline" onClick={toggleQr}><QrCode className="mr-1" size={14} />{qrDataUrl ? t('sharedHomeHideUpiQr') : t('sharedHomeShowUpiQr')}</Button></div>{qrError && <p className="text-xs font-semibold text-red-600">{t('sharedHomeQrUnavailable')}</p>}{qrDataUrl && <div className="flex justify-center rounded-xl bg-white p-3"><img src={qrDataUrl} alt={t('auditUpiQrAlt' as any, { name: normalized.payeeName })} className="h-52 w-52" /></div>}</div>}</div>;

  return content;
}
