import React from 'react';
import AppSectionHeader from '@/components/AppSectionHeader';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SharedHomePaymentRequestPanel } from '@/components/SharedHomePaymentRequestDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { decodeSharedHomePaymentRequest, launchSharedHomeUpiPayment, shareSharedHomePaymentRequest, type SharedHomePaymentRequest } from '@/sharedHome/paymentRequest';

export default function SharedHomePaymentRequest() {
  const [, params] = useRoute('/shared-home-payment/:payload');
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [request] = React.useState<SharedHomePaymentRequest | null>(() => params?.payload ? decodeSharedHomePaymentRequest(params.payload) : null);
  if (!request) {
    return <div className="grid min-h-screen place-items-center bg-kharcha-cream px-4"><Card className="w-full max-w-md rounded-2xl border-2 border-[#e7d7bd] bg-white p-6 text-center"><h1 className="text-xl font-black text-kharcha-navy">{t('sharedHomeInvalidPaymentRequest')}</h1><p className="mt-2 text-sm text-gray-600">{t('sharedHomePaymentRequestHelp')}</p><Button className="mt-5 bg-[#16834b] text-white" onClick={() => navigate('/')}>{t('sharedHomeBackToKharcha')}</Button></Card></div>;
  }

  const payViaUpi = () => {
    const deepLink = launchSharedHomeUpiPayment(request);
    if (!deepLink) window.alert(t('sharedHomeNoUpiPaymentFallback'));
  };

  const shareRequest = async () => {
    const result = await shareSharedHomePaymentRequest(request, {
      heading: t('sharedHomePaymentRequest'),
      pay: t('sharedHomePayViaUpi'),
      amount: t('amount'),
      forLabel: t('sharedHomeReason'),
      whoPays: t('sharedHomeWhoPays'),
      whoReceives: t('sharedHomeWhoReceives'),
      upiId: t('sharedHomeUpiId'),
      unavailable: t('sharedHomePaymentFallback'),
      footer: t('sharedHomePaymentPending'),
    });
    window.alert(result === 'shared' ? t('sharedHomeShareSuccess') : result === 'copied' ? t('sharedHomePaymentLinkCopied') : t('sharedHomeShareFailed'));
  };

  return <div className="min-h-screen bg-kharcha-cream px-4 py-5"><div className="mx-auto max-w-md"><AppSectionHeader title={t('sharedHomePaymentRequest')} onBack={() => navigate('/')} backLabel={t('sharedHomeBackToKharcha')} /><div className="mt-4"><SharedHomePaymentRequestPanel request={request} onPayViaUpi={payViaUpi} onSharePaymentRequest={shareRequest} /></div></div></div>;
}
