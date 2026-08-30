import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import type { RentConfig, RentSplitMethod, SharedHome, StayDayBasis } from '@/sharedHome/types';
import { applyRentAdjustment, calculateRentAllocations, validateAllocations } from '@/sharedHome/calculations';

interface Props {
  open: boolean;
  home: SharedHome;
  monthKey: string;
  onOpenChange: (open: boolean) => void;
  onSave: (config: RentConfig, allocations: Record<string, number>, calculation: ReturnType<typeof calculateRentAllocations>['calculation'], adjustment?: { calculatedAmount: number; adjustedAmount: number; reason?: string; createdAt: number }) => void;
}

function dateInput(value: number | undefined): string {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export default function SharedHomeRentDialog({ open, home, monthKey, onOpenChange, onSave }: Props) {
  const { t } = useLanguage();
  const [totalRent, setTotalRent] = useState('');
  const [splitMethod, setSplitMethod] = useState<RentSplitMethod>('equal-person');
  const [stayDayBasis, setStayDayBasis] = useState<StayDayBasis>('calendar');
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [roomValues, setRoomValues] = useState<Record<string, string>>({});
  const [roomMemberValues, setRoomMemberValues] = useState<Record<string, Record<string, string>>>({});
  const [dueDate, setDueDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [adjustedTotal, setAdjustedTotal] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTotalRent(home.rentConfig?.totalRent ? String(home.rentConfig.totalRent) : '');
    setSplitMethod(home.rentConfig?.splitMethod ?? 'equal-person');
    setStayDayBasis(home.rentConfig?.stayDayBasis ?? 'calendar');
    setCustomValues({});
    setRoomValues({});
    setRoomMemberValues({});
    setDueDate(dateInput(home.rentConfig?.dueDate));
    setEndDate(dateInput(home.rentConfig?.endDate));
    setNotes(home.rentConfig?.notes ?? '');
    const period = home.rentPeriods.find(item => item.monthKey === monthKey);
    setAdjustedTotal(period?.adjustment ? String(period.adjustment.adjustedAmount) : '');
    setAdjustmentReason(period?.adjustment?.reason ?? '');
    setAutoGenerate(home.rentConfig?.autoGenerate ?? true);
    setError('');
  }, [open, home.rentConfig, home.rentPeriods, monthKey]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const total = Number(totalRent);
    if (!total || total <= 0) {
      setError(t('sharedHomeRequiredMessage', { field: t('sharedHomeTotalRent') }));
      return;
    }
    const adjusted = adjustedTotal.trim() ? Number(adjustedTotal) : undefined;
    if (adjusted !== undefined && (!adjusted || adjusted <= 0)) {
      setError(t('sharedHomeGreaterThanZeroMessage', { field: t('sharedHomeAdjustedTotal') }));
      return;
    }
    if (adjusted !== undefined && adjusted !== total && !adjustmentReason.trim()) {
      setError(t('sharedHomeChangedTotalReasonMessage', { field: t('sharedHomeAdjustmentReason') }));
      return;
    }
    const customAllocations = Object.fromEntries(home.members.filter(member => member.isActive).map(member => [member.id, Number(customValues[member.id] || 0)]));
    const roomAllocations = Object.fromEntries(home.rooms.map(room => [room.id, Number(roomValues[room.id] || 0)]));
    const roomMemberAllocations = Object.fromEntries(Object.entries(roomMemberValues).map(([roomId, values]) => [roomId, Object.fromEntries(Object.entries(values).map(([memberId, value]) => [memberId, Number(value || 0)]))]));
    if (splitMethod === 'custom' && !validateAllocations(total, customAllocations).valid) {
      setError(t('sharedHomeAllocationsEqualTotal'));
      return;
    }
    if (splitMethod === 'room-fixed' && !validateAllocations(total, roomAllocations).valid) {
      setError(t('sharedHomeRoomAllocationsEqualTotal'));
      return;
    }
    if (splitMethod === 'room-fixed' || splitMethod === 'equal-room') {
      for (const room of home.rooms) {
        const values = roomMemberAllocations[room.id];
        if (values && Object.keys(values).length > 0) {
          const roomTotal = splitMethod === 'room-fixed' ? Number(roomAllocations[room.id] ?? 0) : total / Math.max(home.rooms.length, 1);
          if (!validateAllocations(roomTotal, values).valid) {
            setError(`${t('sharedHomeRoomMemberAllocationsEqual')} (${room.name}).`);
            return;
          }
        }
      }
    }
    const config: RentConfig = {
      totalRent: total,
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00Z`).getTime() : undefined,
      startDate: home.rentConfig?.startDate ?? home.startDate,
      endDate: endDate ? new Date(`${endDate}T00:00:00Z`).getTime() : undefined,
      frequency: 'monthly',
      splitMethod,
      stayDayBasis,
      autoGenerate,
      notes: notes.trim() || undefined,
      customAllocations: splitMethod === 'custom' ? customAllocations : undefined,
      roomAllocations: splitMethod === 'room-fixed' ? roomAllocations : undefined,
      roomMemberAllocations: (splitMethod === 'room-fixed' || splitMethod === 'equal-room') ? roomMemberAllocations : undefined,
    };
    const result = calculateRentAllocations(home, config, monthKey);
    const hasAdjustment = adjusted !== undefined && adjusted !== total;
    const targetTotal = adjusted ?? total;
    const adjustedResult = hasAdjustment ? applyRentAdjustment(result.calculation, result.allocations, total, targetTotal) : result;
    const finalAllocations = adjustedResult.allocations;
    const finalCalculation = adjustedResult.calculation;
    onSave(config, finalAllocations, finalCalculation, hasAdjustment ? { calculatedAmount: total, adjustedAmount: targetTotal, reason: adjustmentReason.trim() || undefined, createdAt: Date.now() } : undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto bg-white border-2 border-[#16834b] rounded-2xl">
        <DialogHeader><DialogTitle className="text-xl font-black text-kharcha-navy">{t('sharedHomeRentSetup')}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="home-rent-total">{t('sharedHomeTotalRent')}</Label><Input id="home-rent-total" type="number" min="0.01" step="0.01" value={totalRent} onChange={event => setTotalRent(event.target.value)} placeholder={t('sharedHomeAmountPlaceholder')} /></div>
          <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="home-rent-due">{t('sharedHomeDueDate')}</Label><Input id="home-rent-due" type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="home-rent-end">{t('sharedHomeEndDate')}</Label><Input id="home-rent-end" type="date" value={endDate} onChange={event => setEndDate(event.target.value)} /></div></div>
          <div className="space-y-2"><Label>{t('sharedHomeSplitMethod')}</Label><Select value={splitMethod} onValueChange={value => setSplitMethod(value as RentSplitMethod)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="equal-person">{t('sharedHomeEqualPerPerson')}</SelectItem><SelectItem value="equal-room">{t('sharedHomeEqualPerRoom')}</SelectItem><SelectItem value="room-fixed">{t('sharedHomeRoomFixedRent')}</SelectItem><SelectItem value="stay-days">{t('sharedHomeStayDaysBased')}</SelectItem><SelectItem value="custom">{t('sharedHomeCustomAmount')}</SelectItem></SelectContent></Select></div>
          {splitMethod === 'stay-days' && <div className="space-y-2"><Label>{t('sharedHomeStayDayBasis')}</Label><Select value={stayDayBasis} onValueChange={value => setStayDayBasis(value as StayDayBasis)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="calendar">{t('sharedHomeCalendarDays')}</SelectItem><SelectItem value="fixed30">{t('sharedHomeFixed30Days')}</SelectItem></SelectContent></Select></div>}
          {splitMethod === 'custom' && <div className="space-y-2 rounded-xl bg-[#fffaf3] p-3"><p className="text-xs text-gray-600">{t('sharedHomeAllocationsEqualTotal')}</p>{home.members.filter(member => member.isActive).map(member => <div key={member.id} className="grid grid-cols-[1fr_110px] items-center gap-2"><span className="text-sm font-semibold">{member.name}</span><Input type="number" min="0" step="0.01" value={customValues[member.id] ?? ''} onChange={event => setCustomValues(current => ({ ...current, [member.id]: event.target.value }))} placeholder={t('sharedHomeZeroAmountPlaceholder')} /></div>)}</div>}
          {(splitMethod === 'room-fixed' || splitMethod === 'equal-room') && <div className="space-y-3 rounded-xl bg-[#fffaf3] p-3"><p className="text-xs text-gray-600">{t('sharedHomeRoomMemberAllocationsEqual')}</p>{home.rooms.map(room => { const roomMembers = home.members.filter(member => member.isActive && member.roomAssignments.some(assignment => assignment.roomId === room.id && !assignment.endDate)); const roomTotal = splitMethod === 'room-fixed' ? Number(roomValues[room.id] || 0) : Number(totalRent || 0) / Math.max(home.rooms.length, 1); return <div key={room.id} className="space-y-2 rounded-lg border bg-white p-2"><div className="flex items-center justify-between"><span className="text-sm font-black">{room.name}</span>{splitMethod === 'room-fixed' && <Input className="h-8 w-28" type="number" min="0" step="0.01" value={roomValues[room.id] ?? ''} onChange={event => setRoomValues(current => ({ ...current, [room.id]: event.target.value }))} placeholder={t('sharedHomeZeroAmountPlaceholder')} />}</div>{roomMembers.length > 1 && <div className="space-y-1 border-t pt-2">{roomMembers.map(member => <div key={member.id} className="grid grid-cols-[1fr_100px] items-center gap-2"><span className="text-xs font-semibold">{member.name}</span><Input className="h-8" type="number" min="0" step="0.01" value={roomMemberValues[room.id]?.[member.id] ?? ''} onChange={event => setRoomMemberValues(current => ({ ...current, [room.id]: { ...(current[room.id] ?? {}), [member.id]: event.target.value } }))} placeholder={`₹${roomTotal.toFixed(0)}`} /></div>)}</div>}</div>; })}</div>}
          <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="home-rent-adjusted">{t('sharedHomeAdjustedTotal')}</Label><Input id="home-rent-adjusted" type="number" min="0.01" step="0.01" value={adjustedTotal} onChange={event => setAdjustedTotal(event.target.value)} placeholder={t('sharedHomeOptionalPlaceholder')} /></div><div className="space-y-2"><Label htmlFor="home-rent-adjustment-reason">{t('sharedHomeAdjustmentReason')}</Label><Input id="home-rent-adjustment-reason" value={adjustmentReason} onChange={event => setAdjustmentReason(event.target.value)} placeholder={t('sharedHomeOptionalPlaceholder')} /></div></div>
          <div className="space-y-2"><Label htmlFor="home-rent-notes">{t('sharedHomeNotes')}</Label><Input id="home-rent-notes" value={notes} onChange={event => setNotes(event.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={autoGenerate} onChange={event => setAutoGenerate(event.target.checked)} />{t('sharedHomeAutoGenerateRent')}</label>
          {error && <p className="text-sm font-semibold text-red-600" role="alert">{error}</p>}
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button><Button type="submit" className="bg-[#16834b] text-white hover:bg-[#11663b]">{t('sharedHomeSave')}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
