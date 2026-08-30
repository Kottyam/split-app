import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, CheckCircle, XCircle, ScanLine, Camera, Link2 } from 'lucide-react';
import { Trip, ExpenseCategory } from '@/types';
import { useTrips } from '@/hooks/useTrips';
import { getAllCategories, getCategoryInfo } from '@/lib/categories';
import { launchScannedUpiPayment } from '@/lib/upi';
import { buildExpenseSplits } from '@/lib/tripPayment';
import { buildScannedUpiPaymentLink, isQrScannerSupported } from '@/lib/qrPayment';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface TripPayExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip;
}

type Step = 'details' | 'scan' | 'confirm' | 'split';
type BarcodeDetectorLike = new (options?: { formats?: string[] }) => {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

export interface QrPaymentTransition {
  step: 'confirm';
  deepLink: string;
  amount: number;
}

export function resolveQrPaymentTransition(rawValue: string, amount: string, tripName: string, itemNote: string): QrPaymentTransition | null {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return null;
  const payment = buildScannedUpiPaymentLink(rawValue, numericAmount, tripName, itemNote);
  if (!payment) return null;
  return { step: 'confirm', deepLink: payment.deepLink, amount: numericAmount };
}

function tripCategoryLabel(t: (key: any, variables?: any) => string, category: ExpenseCategory) {
  const keys: Record<ExpenseCategory, string> = { food: 'auditTripFood', transport: 'auditTripTransport', hotel: 'auditTripHotel', shopping: 'auditTripShopping', entertainment: 'auditTripEntertainment', others: 'auditTripOthers' };
  return t(keys[category]);
}

export default function TripPayExpenseDialog({ open, onOpenChange, trip }: TripPayExpenseDialogProps) {
  const { t } = useLanguage();
  const { addExpense } = useTrips();
  const categories = useMemo(() => getAllCategories(), []);
  const [step, setStep] = useState<Step>('details');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('others');
  const [paidBy, setPaidBy] = useState(trip.members[0]?.id || '');
  const [splitType, setSplitType] = useState<'equal-all' | 'equal-selected' | 'custom'>('equal-all');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(() => new Set(trip.members.map(member => member.id)));

  const handleSplitTypeChange = (nextType: 'equal-all' | 'equal-selected' | 'custom') => {
    setSplitType(nextType);
    if (nextType === 'equal-all') {
      setSelectedMembers(new Set(trip.members.map(member => member.id)));
    }
  };
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [manualQrValue, setManualQrValue] = useState('');
  const [scanError, setScanError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  const stopCamera = () => {
    if (scanTimerRef.current !== null) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const reset = () => {
    stopCamera();
    setStep('details');
    setDescription('');
    setAmount('');
    setCategory('others');
    setPaidBy(trip.members[0]?.id || '');
    setSplitType('equal-all');
    setSelectedMembers(new Set(trip.members.map(member => member.id)));
    setCustomSplits({});
    setManualQrValue('');
    setScanError('');
  };

  const close = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const toggleMember = (id: string) => {
    const next = new Set(selectedMembers);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedMembers(next);
  };

  const launchScannedPayment = (rawValue: string) => {
    const transition = resolveQrPaymentTransition(rawValue, amount, trip.name, description.trim());
    if (!transition) {
      setScanError(t('auditScanQrInvalid' as any));
      return;
    }

    const deepLink = launchScannedUpiPayment(rawValue, transition.amount, trip.name, description.trim());
    if (!deepLink) {
      setScanError(t('auditScanOpenFailed' as any));
      return;
    }

    stopCamera();
    setStep(transition.step);
    toast.success(t('auditUpiOpening' as any));
  };

  const startCamera = async () => {
    setScanError('');
    if (!isQrScannerSupported()) {
      setScanError(t('auditCameraQrUnavailable' as any));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraActive(true);

      const BarcodeDetectorConstructor = (window as Window & { BarcodeDetector?: BarcodeDetectorLike }).BarcodeDetector;
      if (!BarcodeDetectorConstructor) {
        setScanError(t('auditCameraQrUnavailable' as any));
        return;
      }
      const detector = new BarcodeDetectorConstructor({ formats: ['qr_code'] });
      const detectFrame = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const rawValue = codes.find(code => Boolean(code.rawValue))?.rawValue;
          if (rawValue) {
            launchScannedPayment(rawValue);
            return;
          }
        } catch {
          setScanError(t('auditScanReadFailed' as any));
        }
        scanTimerRef.current = window.setTimeout(() => void detectFrame(), 350);
      };
      void detectFrame();
    } catch {
      stopCamera();
      setScanError(t('auditCameraPermission' as any));
    }
  };

  useEffect(() => {
    if (step === 'scan') void startCamera();
    return () => {
      if (step === 'scan') stopCamera();
    };
  }, [step]);

  const handleStartPayment = () => {
    if (!description.trim() || !paidBy) {
      toast.error(t('auditDetailsRequired' as any));
      return;
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error(t('auditScanAmountRequired' as any));
      return;
    }
    setScanError('');
    setManualQrValue('');
    setStep('scan');
  };

  const handleSaveExpense = () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error(t('auditSaveAmountRequired' as any));
      return;
    }
    const memberIds = splitType === 'equal-all' ? trip.members.map(member => member.id) : Array.from(selectedMembers);
    if (memberIds.length === 0) {
      toast.error(t('auditChooseSplitMember' as any));
      return;
    }

    let splits: Record<string, number>;
    try {
      splits = buildExpenseSplits(numericAmount, memberIds, splitType, customSplits);
    } catch {
      toast.error(t('auditCustomSplitRequired' as any, { amount: numericAmount.toFixed(2) }));
      return;
    }

    addExpense(trip.id, description.trim(), numericAmount, category, paidBy, Date.now(), splits);
    toast.success(t('auditTripExpenseAdded' as any));
    close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="bg-white border-2 border-[#18324b] rounded-2xl max-h-[90vh] overflow-y-auto">
        {step === 'details' && (
          <>
            <DialogHeader>
              <DialogTitle className="font-black text-[#18324b] text-xl flex items-center gap-2"><ScanLine size={20} /> {t('auditPayScanMerchantQr' as any)}</DialogTitle>
              <DialogDescription className="text-gray-600">{t('auditPayScanDescription' as any)}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label className="font-bold text-[#18324b]">{t('auditItemToBuy' as any)}</Label><Input value={description} onChange={event => setDescription(event.target.value)} placeholder={t('auditItemPlaceholder' as any)} className="border-2 border-[#e87817] rounded-lg mt-1" /></div>
              <div><Label className="font-bold text-[#18324b]">{t('auditAmountRupees' as any)}</Label><Input type="number" min="1" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="₹100" className="border-2 border-[#e87817] rounded-lg mt-1" /></div>
              <div><Label className="font-bold text-[#18324b]">{t('auditCategory' as any)}</Label><Select value={category} onValueChange={value => setCategory(value as ExpenseCategory)}><SelectTrigger className="border-2 border-[#e87817] rounded-lg mt-1"><SelectValue /></SelectTrigger><SelectContent>{categories.map(item => <SelectItem key={item} value={item}>{tripCategoryLabel(t, item)}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="font-bold text-[#18324b]">{t('auditPaidBy' as any)}</Label><Select value={paidBy} onValueChange={setPaidBy}><SelectTrigger className="border-2 border-[#e87817] rounded-lg mt-1"><SelectValue placeholder={t('auditChoosePayer' as any)} /></SelectTrigger><SelectContent>{trip.members.map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}</SelectContent></Select></div>
              {trip.members.length === 0 && <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-800">{t('auditNoMembersAdded' as any)}</div>}
              <div className="rounded-lg border-2 border-[#16834b] bg-[#e6f3e8] p-3 text-sm text-[#18324b]"><strong>{t('auditQrPayment' as any)}:</strong> {t('auditQrPaymentDescription' as any)}</div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => close(false)} className="border-2 border-[#18324b] rounded-lg">{t('auditCancel' as any)}</Button><Button onClick={handleStartPayment} disabled={trip.members.length === 0} className="bg-kharcha-saffron text-white font-bold rounded-lg hover:brightness-95"><Camera size={16} className="mr-2" /> {t('auditScanQrPay' as any)}</Button></DialogFooter>
          </>
        )}
        {step === 'scan' && (
          <>
            <DialogHeader>
              <DialogTitle className="font-black text-[#18324b] text-xl flex items-center gap-2"><Camera size={20} /> {t('auditScanMerchantQr' as any)}</DialogTitle>
              <DialogDescription className="text-gray-600">{t('auditScanMerchantDescription' as any, { amount: Number(amount).toFixed(2) })}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-xl border-2 border-[#16834b] bg-slate-900 aspect-square">
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted aria-label={t('auditQrScannerPreview' as any)} />
                <div className="pointer-events-none absolute inset-10 rounded-2xl border-4 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
                {!cameraActive && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white font-semibold">{scanError || t('auditStartingCamera' as any)}</div>}
              </div>
              {scanError && <p className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-800">{scanError}</p>}
              <Button type="button" onClick={() => void startCamera()} variant="outline" className="w-full border-2 border-[#16834b] rounded-lg"><Camera size={16} className="mr-2" /> {t('auditStartCameraAgain' as any)}</Button>
              <div className="border-t-2 border-gray-200 pt-4 space-y-2">
                <Label className="font-bold text-[#18324b]">{t('auditManualUpiFallback' as any)}</Label>
                <Input value={manualQrValue} onChange={event => setManualQrValue(event.target.value)} placeholder={t('auditUpiPlaceholder' as any)} className="border-2 border-[#e87817] rounded-lg" />
                <Button type="button" onClick={() => launchScannedPayment(manualQrValue)} disabled={!manualQrValue.trim()} className="w-full bg-blue-600 text-white font-bold rounded-lg"><Link2 size={16} className="mr-2" /> {t('auditUseUpiLink' as any)}</Button>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => close(false)} className="border-2 border-[#18324b] rounded-lg">{t('auditCancel' as any)}</Button></DialogFooter>
          </>
        )}
        {step === 'confirm' && (
          <>
            <DialogHeader><DialogTitle className="font-black text-[#18324b] text-xl">{t('auditDidCompletePayment' as any)}</DialogTitle><DialogDescription className="text-gray-600">{t('auditConfirmPaymentDescription' as any)}</DialogDescription></DialogHeader>
            <div className="rounded-xl border-2 border-[#16834b] bg-[#e6f3e8] p-4"><p className="font-bold text-[#18324b]">{description}</p><p className="text-sm text-gray-700">{t('auditMerchantPaymentSummary' as any, { name: trip.name, amount: Number(amount).toFixed(2), status: t('auditSentToMerchant' as any) })}</p></div>
            <DialogFooter className="gap-2"><Button onClick={() => setStep('scan')} variant="outline" className="border-2 border-red-500 text-red-600 rounded-lg"><XCircle size={16} className="mr-2" /> {t('auditNoCancel' as any)}</Button><Button onClick={() => setStep('split')} className="bg-kharcha-green text-white font-bold rounded-lg hover:brightness-95"><CheckCircle size={16} className="mr-2" /> {t('auditYesPaidSplit' as any)}</Button></DialogFooter>
          </>
        )}
        {step === 'split' && (
          <>
            <DialogHeader><DialogTitle className="font-black text-[#18324b] text-xl">{t('auditHowSplit' as any)}</DialogTitle><DialogDescription className="text-gray-600">{t('auditSplitDescription' as any)}</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div><Label className="font-bold text-[#18324b]">{t('auditAmountPaid' as any)}</Label><Input type="number" min="1" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="₹100" className="border-2 border-[#e87817] rounded-lg mt-1" /></div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold"><input type="radio" checked={splitType === 'equal-all'} onChange={() => handleSplitTypeChange('equal-all')} /> {t('auditEqualAll' as any)}</label>
                <label className="flex items-center gap-2 font-semibold"><input type="radio" checked={splitType === 'equal-selected'} onChange={() => handleSplitTypeChange('equal-selected')} /> {t('auditEqualSelected' as any)}</label>
                <label className="flex items-center gap-2 font-semibold"><input type="radio" checked={splitType === 'custom'} onChange={() => handleSplitTypeChange('custom')} /> {t('auditCustomSplitMode' as any)}</label>
              </div>
              <p className="text-sm font-semibold text-[#18324b]">{splitType === 'equal-all' ? t('auditAllMembersIncluded' as any) : splitType === 'equal-selected' ? t('auditSelectPeople' as any) : t('auditCustomAmountsHint' as any)}</p>
              <div className="space-y-2">{trip.members.map(member => <div key={member.id} className="flex items-center gap-2"><Checkbox checked={splitType === 'equal-all' ? true : selectedMembers.has(member.id)} disabled={splitType === 'equal-all'} onCheckedChange={() => toggleMember(member.id)} /><span className="flex-1 font-semibold">{member.name}</span>{splitType === 'custom' && selectedMembers.has(member.id) && <Input type="number" min="0" step="0.01" value={customSplits[member.id] || ''} onChange={event => setCustomSplits({ ...customSplits, [member.id]: event.target.value })} placeholder="₹0" className="w-24 border-2 border-[#e87817] rounded-lg" />}</div>)}</div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => close(false)} className="border-2 border-[#18324b] rounded-lg">{t('auditDiscard' as any)}</Button><Button onClick={handleSaveExpense} className="bg-kharcha-green text-white font-bold rounded-lg hover:brightness-95">{t('auditSaveExpenseSplit' as any)}</Button></DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
