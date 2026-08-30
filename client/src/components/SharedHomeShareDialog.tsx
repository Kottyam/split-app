import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SharedHomeShareRange } from '@/sharedHome/share';
import type { SharedHome } from '@/sharedHome/types';
import { useLocation } from 'wouter';
import EditSyncShareDialog from '@/components/EditSyncShareDialog';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: (range: SharedHomeShareRange, dateRange?: { startDate?: number; endDate?: number }) => void;
  home?: SharedHome;
}

export default function SharedHomeShareDialog({ open, onOpenChange, onShare, home }: Props) {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [range, setRange] = useState<SharedHomeShareRange>('current-month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showEditSync, setShowEditSync] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRange('current-month');
    setStartDate('');
    setEndDate('');
  }, [open]);

  const submit = () => {
    const dateRange = range === 'date-range' ? {
      startDate: startDate ? new Date(`${startDate}T00:00:00Z`).getTime() : undefined,
      endDate: endDate ? new Date(`${endDate}T23:59:59Z`).getTime() : undefined,
    } : undefined;
    onShare(range, dateRange);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('sharedHomeShare')}</DialogTitle>
            <DialogDescription>{t('sharedHomeShareLinkNote')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>{t('sharedHomeShareRange')}</Label>
            <div className="grid gap-2">
              <label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold"><input type="radio" checked={range === 'current-month'} onChange={() => setRange('current-month')} />{t('sharedHomeCurrentMonth')}</label>
              <label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold"><input type="radio" checked={range === 'full-group'} onChange={() => setRange('full-group')} />{t('sharedHomeFullGroupHistory')}</label>
              <label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold"><input type="radio" checked={range === 'date-range'} onChange={() => setRange('date-range')} />{t('sharedHomeCustomDateRange')}</label>
            </div>
            {range === 'date-range' && <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="shared-home-share-start">{t('startDate')}</Label><Input id="shared-home-share-start" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></div><div className="space-y-1"><Label htmlFor="shared-home-share-end">{t('endDate')}</Label><Input id="shared-home-share-end" type="date" value={endDate} onChange={event => setEndDate(event.target.value)} /></div></div>}
            <p className="text-xs text-gray-500">{t('sharedHomeShareRangeHelp')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
            {home && <Button onClick={() => { onOpenChange(false); setShowEditSync(true); }} className="bg-kharcha-navy text-white">{t('editAndSyncTitle' as any)}</Button>}
            <Button variant="outline" onClick={() => { onOpenChange(false); navigate('/sync-updates'); }} className="border-[#16834b] text-kharcha-navy">{t('editAndSyncTitle' as any)} · {t('editSyncReviewChanges' as any)}</Button>
            <Button onClick={submit} className="bg-[#16834b] text-white hover:bg-[#11663b]">{t('sharedHomeShare')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {home && <EditSyncShareDialog open={showEditSync} onOpenChange={setShowEditSync} contextType="shared_home" contextId={home.id} contextName={home.name} snapshot={home} />}
    </>
  );
}
