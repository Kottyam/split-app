import { useEffect, useRef, useState } from 'react';
import { Camera, CreditCard, ImageUp, Link2, ListPlus, ScanLine, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trip, ExpenseCategory } from '@/types';
import { useTrips } from '@/hooks/useTrips';
import { buildExpenseSplits } from '@/lib/tripPayment';
import { BulkScanItem, isQrScannerSupported, toBulkScanItem } from '@/lib/qrPayment';
import { decodeQrFromImageFile, decodeQrFromVideo, cameraErrorKey } from '@/lib/qrDecode';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTripReportCategoryKey } from '@/lib/tripReport';
import { launchScannedUpiPayment } from '@/lib/upi';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; trip: Trip }

/**
 * Scan several UPI QR codes in one session (camera, picked image or pasted
 * link). Each scan becomes a row prefilled from pa/pn/am; the user can pay
 * any row via their UPI app and then add all rows as trip expenses at once.
 */
export default function TripBulkQrScanDialog({ open, onOpenChange, trip }: Props) {
  const { addExpense } = useTrips();
  const { t } = useLanguage();
  const [items, setItems] = useState<BulkScanItem[]>([]);
  const [paidBy, setPaidBy] = useState(trip.members[0]?.id || '');
  const [category, setCategory] = useState<ExpenseCategory>('others');
  const [cameraOn, setCameraOn] = useState(false);
  const [askPermission, setAskPermission] = useState(true);
  const [error, setError] = useState('');
  const [manual, setManual] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const itemsRef = useRef<BulkScanItem[]>([]);
  const cooldownRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  itemsRef.current = items;

  const stopCamera = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const addRaw = (raw: string, source: 'camera' | 'manual' | 'image') => {
    const item = toBulkScanItem(raw, itemsRef.current);
    if (!item) {
      if (source !== 'camera') toast.error(t('bulkNotUpiQr' as any));
      return false;
    }
    setItems(prev => [...prev, item]);
    if ('vibrate' in navigator) try { navigator.vibrate(80); } catch { /* ignore */ }
    toast.success(`${t('bulkScanned' as any, { payee: item.payee })}${item.amount ? ` · ₹${item.amount}` : ''}`);
    return true;
  };

  const startCamera = async () => {
    setError('');
    setAskPermission(false);
    if (!isQrScannerSupported()) { setError(t('camErrUnavailable' as any)); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) { stopCamera(); return; }
      video.srcObject = stream;
      await video.play();
      setCameraOn(true);
      const loop = async () => {
        if (!streamRef.current || !videoRef.current) return;
        if (Date.now() > cooldownRef.current) {
          const raw = await decodeQrFromVideo(videoRef.current).catch(() => null);
          if (raw && addRaw(raw, 'camera')) cooldownRef.current = Date.now() + 1500;
        }
        timerRef.current = window.setTimeout(() => void loop(), 250);
      };
      void loop();
    } catch (e) {
      stopCamera();
      setError(t(cameraErrorKey(e) as any));
    }
  };

  useEffect(() => () => stopCamera(), []);
  useEffect(() => { if (!open) stopCamera(); }, [open]);

  const close = (next: boolean) => {
    if (!next) { stopCamera(); setItems([]); setManual(''); setError(''); setAskPermission(true); }
    onOpenChange(next);
  };

  const onPickImage = async (file?: File) => {
    if (!file) return;
    const raw = await decodeQrFromImageFile(file);
    if (!raw) toast.error(t('bulkNoQrInImage' as any));
    else addRaw(raw, 'image');
    if (fileRef.current) fileRef.current.value = '';
  };

  const update = (key: string, patch: Partial<BulkScanItem>) => setItems(prev => prev.map(i => i.key === key ? { ...i, ...patch } : i));

  const payNow = (item: BulkScanItem) => {
    const n = Number(item.amount);
    if (!Number.isFinite(n) || n <= 0) { toast.error(t('bulkEnterAmountFirst' as any)); document.getElementById(`bulk-amt-${item.key}`)?.focus(); return; }
    if (!launchScannedUpiPayment(item.raw, n, trip.name, item.description.trim())) toast.error(t('bulkCouldNotOpenUpi' as any));
  };

  const saveAll = () => {
    if (!paidBy) { toast.error(t('bulkChooseWhoPaid' as any)); return; }
    const bad = items.find(i => !i.description.trim() || !(Number(i.amount) > 0));
    if (bad) { toast.error(t('bulkRowsNeedDetails' as any)); document.getElementById(`bulk-amt-${bad.key}`)?.focus(); return; }
    const memberIds = trip.members.map(m => m.id);
    for (const i of items) {
      const amt = Math.round(Number(i.amount) * 100) / 100;
      addExpense(trip.id, i.description.trim(), amt, category, paidBy, Date.now(), buildExpenseSplits(amt, memberIds, 'equal-all', {}), `UPI: ${i.upiId}`);
    }
    toast.success(t('bulkAddedExpenses' as any, { count: items.length }));
    close(false);
  };

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="bg-white border-2 border-[#18324b] rounded-2xl max-h-[92vh] overflow-y-auto" data-testid="bulk-qr-dialog">
        <DialogHeader>
          <DialogTitle className="font-black text-[#18324b] text-xl flex items-center gap-2"><ScanLine size={20} /> {t('bulkTitle' as any)}</DialogTitle>
          <DialogDescription className="text-gray-600">{t('bulkDescription' as any)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border-2 border-[#16834b] bg-slate-900 aspect-square max-h-72 mx-auto w-full">
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted aria-label={t('bulkScannerPreview' as any)} />
            {cameraOn && <div className="pointer-events-none absolute inset-10 rounded-2xl border-4 border-white/80" />}
            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center text-white">
                <Camera size={32} />
                <p className="text-sm font-semibold">{error || (askPermission ? t('bulkCameraPermission' as any) : t('bulkStartingCamera' as any))}</p>
                <Button type="button" onClick={() => void startCamera()} className="bg-kharcha-saffron text-white font-bold"><Camera size={16} className="mr-2" />{error ? t('bulkTryCameraAgain' as any) : t('bulkAllowCamera' as any)}</Button>
              </div>
            )}
          </div>
          {cameraOn && <p className="text-center text-xs font-semibold text-slate-600">{t('bulkKeepScanning' as any)} <button type="button" className="underline" onClick={stopCamera}>{t('bulkStopCamera' as any)}</button></p>}

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Input value={manual} onChange={e => setManual(e.target.value)} placeholder={t('bulkPastePlaceholder' as any)} aria-label={t('bulkPasteAria' as any)} />
            <Button type="button" variant="outline" disabled={!manual.trim()} onClick={() => { if (addRaw(manual, 'manual')) setManual(''); }}><Link2 size={16} className="mr-1" />{t('bulkAdd' as any)}</Button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => void onPickImage(e.target.files?.[0])} data-testid="bulk-qr-image" />
          <Button type="button" variant="outline" className="w-full" onClick={() => fileRef.current?.click()}><ImageUp size={16} className="mr-2" />{t('pickQrImage' as any)}</Button>

          {items.length > 0 && (
            <div className="space-y-2" data-testid="bulk-qr-items">
              <p className="text-xs font-black uppercase tracking-wider text-kharcha-navy">{t('bulkScannedCount' as any, { count: items.length })} · ₹{total.toLocaleString('en-IN')}</p>
              {items.map(i => (
                <div key={i.key} className="rounded-xl border border-kharcha-line p-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1"><p className="truncate font-black text-kharcha-navy">{i.payee}</p><p className="truncate text-xs text-slate-500">{i.upiId}</p></div>
                    <Button type="button" size="icon" variant="ghost" aria-label={t('bulkRemoveAria' as any, { name: i.payee })} className="text-red-600" onClick={() => setItems(prev => prev.filter(x => x.key !== i.key))}><Trash2 size={15} /></Button>
                  </div>
                  <div className="grid grid-cols-[1fr_6.5rem] gap-2">
                    <Input value={i.description} onChange={e => update(i.key, { description: e.target.value })} aria-label={t('bulkDescriptionLabel' as any)} placeholder={t('bulkDescriptionLabel' as any)} />
                    <Input id={`bulk-amt-${i.key}`} type="number" inputMode="decimal" min="0" value={i.amount} onChange={e => update(i.key, { amount: e.target.value })} aria-label={t('bulkAmountLabel' as any)} placeholder={t('bulkAmountPlaceholder' as any)} />
                  </div>
                  <Button type="button" size="sm" variant="outline" className="w-full border-[#16834b] text-[#16834b]" onClick={() => payNow(i)}><CreditCard size={14} className="mr-1" />{t('bulkPayViaUpi' as any)}</Button>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs font-bold">{t('bulkPaidBy' as any)}</Label>
                  <select aria-label={t('bulkPaidBy' as any)} value={paidBy} onChange={e => setPaidBy(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-white px-2 text-sm">
                    {trip.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select></div>
                <div><Label className="text-xs font-bold">{t('bulkCategory' as any)}</Label>
                  <select aria-label={t('bulkCategory' as any)} value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} className="mt-1 h-9 w-full rounded-md border border-input bg-white px-2 text-sm">
                    {(['food', 'transport', 'hotel', 'shopping', 'entertainment', 'others'] as ExpenseCategory[]).map(c => <option key={c} value={c}>{t(getTripReportCategoryKey(c) as any)}</option>)}
                  </select></div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => close(false)}>{t('bulkCancel' as any)}</Button>
          <Button onClick={saveAll} disabled={items.length === 0 || trip.members.length === 0} className="bg-kharcha-green text-white font-bold"><ListPlus size={16} className="mr-2" />{t('bulkAddAll' as any, { count: items.length || '' })}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
