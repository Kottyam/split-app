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
import { decodeQrFromImageFile, decodeQrFromVideo, describeCameraError } from '@/lib/qrDecode';
import { launchScannedUpiPayment } from '@/lib/upi';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; trip: Trip }

/**
 * Scan several UPI QR codes in one session (camera, picked image or pasted
 * link). Each scan becomes a row prefilled from pa/pn/am; the user can pay
 * any row via their UPI app and then add all rows as trip expenses at once.
 */
export default function TripBulkQrScanDialog({ open, onOpenChange, trip }: Props) {
  const { addExpense } = useTrips();
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
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const addRaw = (raw: string, source: 'camera' | 'manual' | 'image') => {
    const item = toBulkScanItem(raw, itemsRef.current);
    if (!item) {
      if (source !== 'camera') toast.error('That is not a UPI payment QR (upi://pay…)');
      return false;
    }
    setItems(prev => [...prev, item]);
    if ('vibrate' in navigator) try { navigator.vibrate(80); } catch { /* ignore */ }
    toast.success(`Scanned ${item.payee}${item.amount ? ` · ₹${item.amount}` : ''}`);
    return true;
  };

  const startCamera = async () => {
    setError('');
    setAskPermission(false);
    if (!isQrScannerSupported()) { setError('Camera is not available here. Pick a QR image or paste the UPI link below.'); return; }
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
      setError(describeCameraError(e));
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
    if (!raw) toast.error('No QR code found in that image');
    else addRaw(raw, 'image');
    if (fileRef.current) fileRef.current.value = '';
  };

  const update = (key: string, patch: Partial<BulkScanItem>) => setItems(prev => prev.map(i => i.key === key ? { ...i, ...patch } : i));

  const payNow = (item: BulkScanItem) => {
    const n = Number(item.amount);
    if (!Number.isFinite(n) || n <= 0) { toast.error('Enter the amount first'); document.getElementById(`bulk-amt-${item.key}`)?.focus(); return; }
    if (!launchScannedUpiPayment(item.raw, n, trip.name, item.description.trim())) toast.error('Could not open the UPI app');
  };

  const saveAll = () => {
    if (!paidBy) { toast.error('Choose who paid'); return; }
    const bad = items.find(i => !i.description.trim() || !(Number(i.amount) > 0));
    if (bad) { toast.error('Every row needs a description and an amount'); document.getElementById(`bulk-amt-${bad.key}`)?.focus(); return; }
    const memberIds = trip.members.map(m => m.id);
    for (const i of items) {
      const amt = Math.round(Number(i.amount) * 100) / 100;
      addExpense(trip.id, i.description.trim(), amt, category, paidBy, Date.now(), buildExpenseSplits(amt, memberIds, 'equal-all', {}), `UPI: ${i.upiId}`);
    }
    toast.success(`Added ${items.length} expense${items.length > 1 ? 's' : ''}, split equally`);
    close(false);
  };

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="bg-white border-2 border-[#18324b] rounded-2xl max-h-[92vh] overflow-y-auto" data-testid="bulk-qr-dialog">
        <DialogHeader>
          <DialogTitle className="font-black text-[#18324b] text-xl flex items-center gap-2"><ScanLine size={20} /> Scan UPI QRs</DialogTitle>
          <DialogDescription className="text-gray-600">Scan one or more payment QR codes. Payee and amount fill in automatically; pay each one, then add them all as expenses.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border-2 border-[#16834b] bg-slate-900 aspect-square max-h-72 mx-auto w-full">
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted aria-label="QR scanner preview" />
            {cameraOn && <div className="pointer-events-none absolute inset-10 rounded-2xl border-4 border-white/80" />}
            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center text-white">
                <Camera size={32} />
                <p className="text-sm font-semibold">{error || (askPermission ? 'Kharcha needs camera permission to scan QR codes. The camera is only used while this window is open.' : 'Starting camera…')}</p>
                <Button type="button" onClick={() => void startCamera()} className="bg-kharcha-saffron text-white font-bold"><Camera size={16} className="mr-2" />{error ? 'Try camera again' : 'Allow camera & scan'}</Button>
              </div>
            )}
          </div>
          {cameraOn && <p className="text-center text-xs font-semibold text-slate-600">Keep scanning — each new QR is added below. <button type="button" className="underline" onClick={stopCamera}>Stop camera</button></p>}

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Input value={manual} onChange={e => setManual(e.target.value)} placeholder="Paste upi://pay?… link" aria-label="Paste UPI link" />
            <Button type="button" variant="outline" disabled={!manual.trim()} onClick={() => { if (addRaw(manual, 'manual')) setManual(''); }}><Link2 size={16} className="mr-1" />Add</Button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => void onPickImage(e.target.files?.[0])} data-testid="bulk-qr-image" />
          <Button type="button" variant="outline" className="w-full" onClick={() => fileRef.current?.click()}><ImageUp size={16} className="mr-2" />Pick QR image / screenshot</Button>

          {items.length > 0 && (
            <div className="space-y-2" data-testid="bulk-qr-items">
              <p className="text-xs font-black uppercase tracking-wider text-kharcha-navy">Scanned ({items.length}) · ₹{total.toLocaleString('en-IN')}</p>
              {items.map(i => (
                <div key={i.key} className="rounded-xl border border-kharcha-line p-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1"><p className="truncate font-black text-kharcha-navy">{i.payee}</p><p className="truncate text-xs text-slate-500">{i.upiId}</p></div>
                    <Button type="button" size="icon" variant="ghost" aria-label={`Remove ${i.payee}`} className="text-red-600" onClick={() => setItems(prev => prev.filter(x => x.key !== i.key))}><Trash2 size={15} /></Button>
                  </div>
                  <div className="grid grid-cols-[1fr_6.5rem] gap-2">
                    <Input value={i.description} onChange={e => update(i.key, { description: e.target.value })} aria-label="Description" placeholder="Description" />
                    <Input id={`bulk-amt-${i.key}`} type="number" inputMode="decimal" min="0" value={i.amount} onChange={e => update(i.key, { amount: e.target.value })} aria-label="Amount" placeholder="₹ Amount" />
                  </div>
                  <Button type="button" size="sm" variant="outline" className="w-full border-[#16834b] text-[#16834b]" onClick={() => payNow(i)}><CreditCard size={14} className="mr-1" />Pay via UPI app</Button>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs font-bold">Paid by</Label>
                  <select aria-label="Paid by" value={paidBy} onChange={e => setPaidBy(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-white px-2 text-sm">
                    {trip.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select></div>
                <div><Label className="text-xs font-bold">Category</Label>
                  <select aria-label="Category" value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} className="mt-1 h-9 w-full rounded-md border border-input bg-white px-2 text-sm">
                    {(['food', 'transport', 'hotel', 'shopping', 'entertainment', 'others'] as ExpenseCategory[]).map(c => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
                  </select></div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
          <Button onClick={saveAll} disabled={items.length === 0 || trip.members.length === 0} className="bg-kharcha-green text-white font-bold"><ListPlus size={16} className="mr-2" />Add {items.length || ''} expense{items.length === 1 ? '' : 's'} (split equally)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
