import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'wouter';
import { getGroupFundById, saveGroupFund } from '@/groupFund/storage';
import { calculateExpectedAmount, calculateExpectedAmountForPeriod, calculateMemberAddExpectedAmountForConfiguredPeriod, getFundCollectionStartTime, getMemberStartDateValue, resolveCollectionPeriod } from '@/groupFund/calculations';
import type { CollectionPeriodMode } from '@/groupFund/calculations';
import { canCloseCollectionPeriod, closePeriod, getActivePeriodContributions, getAmountAfterCredit, getCreditAfterPayment, getMemberCreditBalance, getMemberPaymentRequestAmount, getPeriodCollectedAmount, getPeriodCollectionStatus, getSavedCollectionAmount, reopenPeriod } from '@/groupFund/collection';
import type { GroupFund, GroupFundMember, Contribution, ContributionStatus, GroupFundExpense } from '@/groupFund/types';
import { KHARCHA_LOGO_LOCKUP } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, Wallet, QrCode, CheckCircle2, History, Trash2, Edit, Search, Upload, UserPlus, Phone, Check, MessageSquare, FileText, RotateCcw, Receipt, AlertCircle, Loader2, Share2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { pickMultipleContacts, formatPhoneNumber } from '@/lib/contacts';
import { appendUniqueMembers } from '@/lib/memberImport';
import { generateGroupFundWhatsAppPaymentUrl, generateGroupFundWhatsAppReminderUrl, generateGroupFundWhatsAppThankYouUrl, generateGroupFundThankYouMessage, generateWhatsAppMessageUrl, normalizeWhatsAppNumber } from '@/groupFund/payment';
import { getBulkMessageCandidates, getBulkMessageDuplicateNumberIds, getBulkMessageKind, getBulkMessageMissingNumberIds, getBulkMessageRecipients, getNextBulkMessageRecipientId, isBulkMessageQueueComplete, toggleBulkMessageMember } from '@/groupFund/bulkMessaging';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeleteConfirmation } from '@/contexts/DeleteConfirmationContext';
import EditSyncShareDialog from '@/components/EditSyncShareDialog';
import EditSyncBackBar from '@/components/EditSyncBackBar';
import EditSyncReviewBar from '@/components/EditSyncReviewBar';
import AppSectionHeader from '@/components/AppSectionHeader';
import { PDF_LAYOUT_CSS } from '@/lib/pdfLayout';

function groupFundOptionLabel(t: (key: any, variables?: any) => string, value?: string) {
  const keys: Record<string, string> = { Food: 'auditFoodSnacks', Other: 'auditOther', Equipment: 'auditEquipment', Maintenance: 'auditMaintenance', Utility: 'auditUtility', Celebration: 'auditEventCelebration', Office: 'auditOffice', Club: 'auditClub', Outing: 'auditOuting', Welfare: 'auditWelfare', 'Common Collection': 'auditCommonCollection', Birthday: 'auditBirthday', Sports: 'auditSports', 'Custom Purpose': 'auditCustomPurpose', Daily: 'auditDaily', Weekly: 'auditWeekly', Monthly: 'auditMonthly', Fixed: 'auditFixed', Variable: 'auditVariable', Default: 'auditDefaultAmount', 'Default Amount': 'auditDefaultAmount', 'Variable Amount': 'auditVariableAmount' };
  return value && keys[value] ? t(keys[value]) : value ?? '';
}

function escapePdfHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function GroupFundDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const { requestDelete } = useDeleteConfirmation();
  const [fund, setFund] = useState<GroupFund | undefined>(() => getGroupFundById(params.id));
  const [activeTab, setActiveTab] = useState<'overview' | 'collection' | 'expenses' | 'members' | 'settle' | 'reports'>('overview');

  const [selectedMemberForCollection, setSelectedMemberForCollection] = useState<GroupFundMember | undefined>();
  const [collectionMethod, setCollectionMethod] = useState<'UPI' | 'Cash'>('UPI');
  const [collectionAmount, setCollectionAmount] = useState('');
  const [upiInputAmount, setUpiInputAmount] = useState('');
  const [savedAmountInput, setSavedAmountInput] = useState('');

  const [showBulkQrModal, setShowBulkQrModal] = useState(false);
  const [showEditSync, setShowEditSync] = useState(false);
  const [bulkAmounts, setBulkAmounts] = useState<Record<string, string>>({});
  const [showBulkMessageModal, setShowBulkMessageModal] = useState(false);
  const [bulkMessageSelectedIds, setBulkMessageSelectedIds] = useState<string[]>([]);
  const [bulkMessageQueue, setBulkMessageQueue] = useState<string[]>([]);
  const [bulkMessageQueueIndex, setBulkMessageQueueIndex] = useState(0);
  const [bulkMessageOpenedCount, setBulkMessageOpenedCount] = useState(0);
  const [bulkMessageText, setBulkMessageText] = useState('');
  const [bulkMessageStatuses, setBulkMessageStatuses] = useState<Record<string, 'Ready' | 'Opened ✓' | 'Failed' | 'Missing Number' | 'Duplicate Number'>>({});
  const [thankYouOpenedByMember, setThankYouOpenedByMember] = useState<Record<string, boolean>>({});
  const bulkMessageAutoAdvanceAt = useRef(0);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<string>('Food');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNote, setExpenseNote] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [isImportingContacts, setIsImportingContacts] = useState(false);

  // Recurring reminder popup state
  const [showRecurringReminderModal, setShowRecurringReminderModal] = useState(false);
  const [reminderInfo, setReminderInfo] = useState<{ title: string; message: string; isUrgent: boolean; remainingDays: number }>({
    title: '',
    message: '',
    isUrgent: false,
    remainingDays: 0,
  });

  const generatePeriods = () => {
    const list: string[] = [];
    const now = new Date();
    const recurringAnchor = fund?.isRecurring ? new Date(getFundCollectionStartTime(fund)) : now;
    const freq = fund?.recurringFrequency;
    
    if (freq === 'Daily') {
      for (let i = -7; i <= 7; i++) {
        const d = new Date(recurringAnchor.getTime() + i * 24 * 60 * 60 * 1000);
        list.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
      }
    } else if (freq === 'Weekly') {
      for (let i = -4; i <= 4; i++) {
        const d = new Date(recurringAnchor.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        list.push(`Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
      }
    } else if (freq === 'Fortnightly') {
      for (let i = -4; i <= 4; i++) {
        const d = new Date(recurringAnchor.getTime() + i * 14 * 24 * 60 * 60 * 1000);
        list.push(`Fortnight of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
      }
    } else if (freq === 'Yearly') {
      for (let i = -2; i <= 2; i++) list.push(`Year ${recurringAnchor.getFullYear() + i}`);
    } else if (freq === 'Custom') {
      const interval = Math.max(1, fund?.customInterval ?? 1);
      const intervalDays = fund?.customIntervalUnit === 'weeks' ? interval * 7 : fund?.customIntervalUnit === 'months' ? 0 : interval;
      for (let i = -4; i <= 4; i++) {
        const d = intervalDays > 0
          ? new Date(recurringAnchor.getTime() + i * intervalDays * 24 * 60 * 60 * 1000)
          : new Date(recurringAnchor.getFullYear(), recurringAnchor.getMonth() + i * interval, recurringAnchor.getDate());
        list.push(`Cycle of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
      }
    } else {
      for (let i = -2; i <= 3; i++) {
        const d = new Date(recurringAnchor.getFullYear(), recurringAnchor.getMonth() + i, 1);
        list.push(d.toLocaleString('en-US', { month: 'long', year: 'numeric' }));
      }
    }
    return list;
  };
  const collectionPeriods = useMemo(generatePeriods, [fund?.id, fund?.isRecurring, fund?.collectionStartDate, fund?.recurringFrequency, fund?.weeklyStartDay, fund?.fortnightlyCycleBoundary, fund?.customInterval, fund?.customIntervalUnit]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => collectionPeriods[2] || collectionPeriods[0]);
  const [collectionDate, setCollectionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [collectionPeriodMode, setCollectionPeriodMode] = useState<CollectionPeriodMode>(fund?.collectionTiming === 'previous' ? 'past' : fund?.collectionTiming === 'advance' ? 'future' : (fund?.collectionPeriodMode ?? 'future'));
  useEffect(() => {
    if (!selectedPeriod) setSelectedPeriod(collectionPeriods[2] || collectionPeriods[0]);
  }, [collectionPeriods, selectedPeriod]);
  useEffect(() => {
    if (!fund) return;
    setCollectionDate(new Date().toISOString().slice(0, 10));
    setCollectionPeriodMode(fund.collectionTiming === 'previous' ? 'past' : fund.collectionTiming === 'advance' ? 'future' : (fund.collectionPeriodMode ?? 'future'));
  }, [fund?.id]);
  useEffect(() => {
    if (!fund || !collectionDate) return;
    const parsedDate = new Date(`${collectionDate}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) return;
    const configuredMode = fund.recurringFrequency === 'Daily' ? 'future' : collectionPeriodMode;
    setSelectedPeriod(resolveCollectionPeriod(fund, parsedDate, configuredMode));
  }, [collectionDate, collectionPeriodMode, fund?.id, fund?.recurringFrequency, fund?.collectionPeriodMode, fund?.weeklyStartDay, fund?.fortnightlyCycleBoundary, fund?.customInterval, fund?.customIntervalUnit, fund?.collectionStartDate]);

  // Check recurring reminder logic on fund open
  useEffect(() => {
    if (fund && fund.isRecurring && fund.recurringFrequency) {
      const now = new Date();
      const freq = fund.recurringFrequency;
      let remainingDays = 0;
      let isUrgent = false;
      let title = '';
      let message = '';

      if (freq === 'Daily') {
        title = t('auditReminderDailyTitle' as any);
        message = t('auditReminderDailyMessage' as any);
        remainingDays = 0;
        isUrgent = true; // Daily is always due today
      } else if (freq === 'Weekly') {
        // Calculate remaining days until end of week (Sunday or 7 days cycle)
        const dayOfWeek = now.getDay();
        remainingDays = Math.max(0, 7 - dayOfWeek);
        if (remainingDays <= 1) {
          isUrgent = true;
          title = t('auditReminderUrgentWeeklyTitle' as any);
          message = t('auditReminderUrgentMessage' as any, { days: remainingDays });
        } else {
          title = t('auditReminderWeeklyTitle' as any);
          message = t('auditReminderRemainingMessage' as any, { days: remainingDays });
        }
      } else if (freq === 'Monthly') {
        // Calculate remaining days until end of month
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        remainingDays = Math.max(0, lastDayOfMonth - now.getDate());
        if (remainingDays <= 1) {
          isUrgent = true;
          title = t('auditReminderUrgentMonthlyTitle' as any);
          message = t('auditReminderUrgentMessage' as any, { days: remainingDays });
        } else {
          title = t('auditReminderMonthlyTitle' as any);
          message = t('auditReminderRemainingMessage' as any, { days: remainingDays });
        }
      } else if (freq === 'Fortnightly' || freq === 'Yearly' || freq === 'Custom') {
        const titleKey = freq === 'Fortnightly' ? 'auditReminderFortnightlyTitle' : freq === 'Yearly' ? 'auditReminderYearlyTitle' : 'auditReminderCustomTitle';
        const frequencyKey = freq === 'Fortnightly' ? 'auditFortnightly' : freq === 'Yearly' ? 'auditYearly' : 'auditCustom';
        title = t(titleKey as any);
        message = t('auditReminderFrequencyMessage' as any, { frequency: t(frequencyKey as any) });
        remainingDays = freq === 'Fortnightly' ? 14 : freq === 'Yearly' ? 365 : Math.max(1, fund.customInterval ?? 1);
        isUrgent = remainingDays <= 1;
      }

      setReminderInfo({ title, message, isUrgent, remainingDays });
      setShowRecurringReminderModal(true);
    }
  }, [fund?.id]);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<GroupFundMember | undefined>();
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberMobile, setMemberMobile] = useState('');
  const [memberExpected, setMemberExpected] = useState('');
  const [memberStartDate, setMemberStartDate] = useState('');
  const [memberStopFrom, setMemberStopFrom] = useState('');
  const [memberStopUntil, setMemberStopUntil] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [collectionStartDate, setCollectionStartDate] = useState(fund?.collectionStartDate ?? new Date(fund?.createdAt ?? Date.now()).toISOString().slice(0, 10));

  useEffect(() => {
    if (!fund || !fund.isRecurring || fund.amountType !== 'Default Amount' || !memberStartDate) return;
    const parsedJoinDate = new Date(`${memberStartDate}T00:00:00`);
    if (Number.isNaN(parsedJoinDate.getTime())) return;
    const draftMember: GroupFundMember = editingMember ?? {
      id: 'member-draft',
      name: memberName || 'Member',
      isActive: true,
      createdAt: Date.now(),
      startDate: memberStartDate,
    };
    const configuredCollectionReference = collectionStartDate || fund.collectionStartDate || collectionDate || new Date().toISOString().slice(0, 10);
    const parsedCollectionDate = new Date(`${configuredCollectionReference}T00:00:00`);
    const expected = calculateMemberAddExpectedAmountForConfiguredPeriod(
      { ...fund, collectionPeriodMode },
      { ...draftMember, startDate: memberStartDate },
      parsedJoinDate,
      Number.isNaN(parsedCollectionDate.getTime()) ? new Date() : parsedCollectionDate,
    );
    setMemberExpected(String(expected));
  }, [editingMember, memberName, memberStartDate, collectionDate, collectionStartDate, collectionPeriodMode, fund?.id, fund?.isRecurring, fund?.amountType, fund?.defaultContributionAmount, fund?.prorationRule, fund?.collectionStartDate, fund?.recurringFrequency, fund?.weeklyStartDay, fund?.fortnightlyCycleBoundary, fund?.monthlyCycleType, fund?.customInterval, fund?.customIntervalUnit]);

  const [showQrDialog, setShowQrDialog] = useState(false);
  const [upiId, setUpiId] = useState(fund?.paymentConfig?.upiId ?? '');

  if (!fund) {
    return (
      <div className="min-h-screen bg-kharcha-cream p-6 text-center">
        <h1 className="text-xl font-black text-kharcha-navy">Group Fund not found</h1>
        <Button onClick={() => navigate('/group-funds')} className="mt-4 bg-kharcha-navy text-white font-bold border border-[#d7e4dc]">Back to Funds</Button>
      </div>
    );
  }

  const refresh = (updated: GroupFund) => {
    saveGroupFund(updated);
    setFund({ ...updated });
  };

  const appendActivity = (f: GroupFund, message: string): GroupFund => {
    return {
      ...f,
      activity: [{ id: nanoid(), message, createdAt: Date.now() }, ...(f.activity || [])],
      updatedAt: Date.now(),
    };
  };

  const periodContributions = fund.contributions.filter((c: Contribution) => c.status !== 'Cancelled' && (!c.note || c.note.includes(selectedPeriod)));
  const totalCollected = periodContributions.reduce((s: number, c: Contribution) => s + c.amount, 0) + (selectedPeriod === collectionPeriods[0] ? (fund.startingBalance ?? 0) : 0);
  const expectedTotal = fund.isRecurring
    ? fund.members.reduce((sum: number, m: GroupFundMember) => sum + calculateExpectedAmountForPeriod(fund, m, selectedPeriod), 0)
    : fund.members.reduce((sum: number, m: GroupFundMember) => sum + (m.expectedAmount ?? fund.defaultContributionAmount ?? 0), 0);
  const closedPeriods = fund.closedPeriods ?? [];
  const isSelectedPeriodClosed = closedPeriods.includes(selectedPeriod);

  const getMemberPeriodContributions = (memberId: string) => getActivePeriodContributions(fund.contributions, memberId, selectedPeriod);
  const allCollectionMembersCollected = canCloseCollectionPeriod(fund, selectedPeriod);

  const activeExpenses = (fund.expenses || []).filter((e: GroupFundExpense) => e.status !== 'cancelled');
  const totalExpenses = activeExpenses.reduce((s: number, e: GroupFundExpense) => s + e.amount, 0);
  const remainingBalance = totalCollected - totalExpenses;

  const handleSaveMemberAmount = () => {
    if (!selectedMemberForCollection) return;
    const amount = parseFloat(savedAmountInput);
    if (isNaN(amount) || amount < 0) {
      toast.error(t('auditInvalidAmount' as any));
      return;
    }
    const next = appendActivity({
      ...fund,
      members: fund.members.map(member => member.id === selectedMemberForCollection.id
        ? { ...member, savedCollectionAmount: amount }
        : member),
    }, t('auditAmountSaved' as any, { name: selectedMemberForCollection.name }));
    refresh(next);
    setSavedAmountInput('');
    setCollectionAmount('');
    setUpiInputAmount('');
    setSelectedMemberForCollection(undefined);
    toast.success(t('auditAmountSaved' as any, { name: selectedMemberForCollection.name }));
  };

  const handleOpenBulkCollection = () => {
    setBulkAmounts(Object.fromEntries(fund.members.map(member => {
      const fallback = getMemberPaymentRequestAmount(fund, member, selectedPeriod);
      return [member.id, getSavedCollectionAmount(member)?.toString() ?? (fallback !== undefined ? fallback.toString() : '')];
    })));
    setShowBulkQrModal(true);
  };

  const getBulkMessageMembers = () => getBulkMessageCandidates(fund.members, 'all');

  const handleOpenBulkMessageDialog = () => {
    const candidates = getBulkMessageMembers();
    const missing = new Set(getBulkMessageMissingNumberIds(candidates, 'all'));
    const duplicates = new Set(getBulkMessageDuplicateNumberIds(candidates, 'all'));
    setBulkMessageSelectedIds(getBulkMessageRecipients(candidates, 'all').map(member => member.id));
    setBulkMessageQueue([]);
    setBulkMessageQueueIndex(0);
    setBulkMessageOpenedCount(0);
    setBulkMessageText('');
    setBulkMessageStatuses(Object.fromEntries(candidates.map(member => [member.id, missing.has(member.id) ? 'Missing Number' : duplicates.has(member.id) ? 'Duplicate Number' : 'Ready'])));
    setShowBulkMessageModal(true);
  };

  const buildBulkMessageUrl = (member: GroupFundMember) => {
    const customMessage = bulkMessageText.trim();
    if (customMessage) return generateWhatsAppMessageUrl(member.mobileNumber, customMessage) ?? '';
    const upiIdConfig = fund.paymentConfig?.upiId?.trim();
    const savedAmount = getSavedCollectionAmount(member);
    const mobileNumber = member.mobileNumber!.trim();
    const recordedCollection = getPeriodCollectionStatus(fund.contributions, member.id, selectedPeriod) === 'Collected';
    const messageKind = getBulkMessageKind({
      hasRecordedCollection: recordedCollection,
      savedAmount,
      hasUpiId: Boolean(upiIdConfig),
    });
    if (messageKind === 'thank-you') {
      return generateGroupFundWhatsAppThankYouUrl({
        fundName: fund.name,
        memberName: member.name,
        amount: getPeriodCollectedAmount(fund.contributions, member.id, selectedPeriod),
        period: selectedPeriod,
        mobileNumber,
        message: t('auditThankYouMessage' as any, {
          name: member.name,
          amount: getPeriodCollectedAmount(fund.contributions, member.id, selectedPeriod).toLocaleString('en-IN'),
          fund: fund.name,
          period: selectedPeriod,
        }),
      });
    }
    if (messageKind === 'payment-link') {
      return generateGroupFundWhatsAppPaymentUrl({
        fundName: fund.name,
        memberName: member.name,
        amount: savedAmount!,
        upiId: upiIdConfig!,
        period: selectedPeriod,
        mobileNumber,
        confirmationMessage: t('auditPaymentConfirmationInstruction' as any),
        note: `Contribution - ${selectedPeriod}`,
      });
    }
    return generateGroupFundWhatsAppReminderUrl({
      fundName: fund.name,
      memberName: member.name,
      period: selectedPeriod,
      mobileNumber,
      message: t('auditBulkContributionReminderMessage' as any, {
        name: member.name,
        fund: fund.name,
        period: selectedPeriod,
      }),
    });
  };

  const openQueuedBulkMessage = (member: GroupFundMember) => {
    const url = buildBulkMessageUrl(member);
    if (!url) { setBulkMessageStatuses(current => ({ ...current, [member.id]: 'Missing Number' })); return false; }
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) { setBulkMessageStatuses(current => ({ ...current, [member.id]: 'Failed' })); toast.error(t('auditPopupBlocked' as any)); return false; }
    setBulkMessageStatuses(current => ({ ...current, [member.id]: 'Opened ✓' }));
    return true;
  };

  const beginBulkMessageQueue = (memberIds: string[]) => {
    if (!bulkMessageText.trim()) { toast.error(t('fillRequired')); return; }
    const upiIdConfig = fund.paymentConfig?.upiId?.trim();
    const recipients = getBulkMessageRecipients(fund.members, 'selection', memberIds);
    if (recipients.length === 0) {
      toast.info(t('auditBulkMessageNoRecipients' as any));
      return;
    }
    if (!upiIdConfig && recipients.some(member => {
      const saved = getSavedCollectionAmount(member);
      return saved !== undefined && saved > 0;
    })) {
      toast.error(t('auditNoUpiConfiguredSettings' as any));
      return;
    }

    setBulkMessageQueue(recipients.map(member => member.id));
    setBulkMessageQueueIndex(0);
    setBulkMessageOpenedCount(0);
    if (openQueuedBulkMessage(recipients[0])) {
      setBulkMessageQueueIndex(1);
      setBulkMessageOpenedCount(1);
      if (recipients.length === 1) toast.success(t('auditBulkMessageOpened' as any, { count: 1 }));
    }
  };

  const handleSendBulkToAll = () => {
    beginBulkMessageQueue(getBulkMessageMembers().map(member => member.id));
  };

  const handleSendBulkSelection = () => {
    beginBulkMessageQueue(bulkMessageSelectedIds);
  };

  const handleOpenNextBulkMessage = () => {
    const memberId = getNextBulkMessageRecipientId(bulkMessageQueue, bulkMessageQueueIndex);
    const member = fund.members.find(item => item.id === memberId);
    if (!member || isBulkMessageQueueComplete(bulkMessageQueue, bulkMessageQueueIndex)) return;
    if (openQueuedBulkMessage(member)) {
      const nextIndex = bulkMessageQueueIndex + 1;
      setBulkMessageQueueIndex(nextIndex);
      setBulkMessageOpenedCount(count => count + 1);
      if (nextIndex >= bulkMessageQueue.length) {
        toast.success(t('auditBulkMessageOpened' as any, { count: bulkMessageOpenedCount + 1 }));
      }
    }
  };

  useEffect(() => {
    const advanceQueueOnReturn = () => {
      if (!showBulkMessageModal || bulkMessageQueue.length === 0 || bulkMessageQueueIndex <= 0 || bulkMessageQueueIndex >= bulkMessageQueue.length) return;
      const now = Date.now();
      if (now - bulkMessageAutoAdvanceAt.current < 800) return;
      bulkMessageAutoAdvanceAt.current = now;
      handleOpenNextBulkMessage();
    };
    const autoOpenNext = () => {
      if (document.visibilityState !== 'visible') return;
      advanceQueueOnReturn();
    };
    document.addEventListener('visibilitychange', autoOpenNext);
    window.addEventListener('pageshow', autoOpenNext);
    window.addEventListener('kharcha-app-resume', advanceQueueOnReturn);
    return () => {
      document.removeEventListener('visibilitychange', autoOpenNext);
      window.removeEventListener('pageshow', autoOpenNext);
      window.removeEventListener('kharcha-app-resume', advanceQueueOnReturn);
    };
  }, [showBulkMessageModal, bulkMessageQueue, bulkMessageQueueIndex, handleOpenNextBulkMessage]);

  const handleCashCollectionDone = () => {
    if (!selectedMemberForCollection) return;
    if (isSelectedPeriodClosed) {
      toast.error(t('auditMonthClosed' as any, { period: selectedPeriod }));
      return;
    }
    const amt = parseFloat(collectionAmount);
    if (isNaN(amt) || amt < 0) {
      toast.error(t('auditInvalidAmount' as any));
      return;
    }
    const expected = fund.isRecurring
      ? calculateExpectedAmountForPeriod(fund, selectedMemberForCollection, selectedPeriod)
      : (selectedMemberForCollection.expectedAmount ?? fund.defaultContributionAmount ?? 0);
    const existingPaid = getPeriodCollectedAmount(fund.contributions, selectedMemberForCollection.id, selectedPeriod);
    const status: ContributionStatus = expected > 0 && (existingPaid + amt) < expected ? 'Partial' : 'Paid';

    const newContribution: Contribution = {
      id: nanoid(),
      fundId: fund.id,
      memberId: selectedMemberForCollection.id,
      amount: amt,
      expectedAmount: expected,
      method: 'Cash',
      date: Date.now(),
      note: `Cash Collection (${selectedPeriod})`,
      status,
      verifiedBy: 'auto_verified',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const next = appendActivity({
      ...fund,
      contributions: [newContribution, ...fund.contributions],
      members: fund.members.map(item => item.id === selectedMemberForCollection.id
        ? { ...item, creditBalance: getCreditAfterPayment(item, expected, existingPaid, amt), savedCollectionAmount: undefined }
        : item),
    }, t('auditCashCollectionActivity' as any, { amount: amt, name: selectedMemberForCollection.name, period: selectedPeriod }));

    refresh(next);
    setSelectedMemberForCollection(undefined);
    setCollectionAmount('');
    toast.success(t('auditCollectedCash' as any, { name: selectedMemberForCollection.name, amount: amt }));
  };

  const handleUpiCollectionDone = () => {
    if (!selectedMemberForCollection) return;
    if (isSelectedPeriodClosed) {
      toast.error(t('auditMonthClosed' as any, { period: selectedPeriod }));
      return;
    }
    const upi = fund.paymentConfig?.upiId;
    if (!upi) {
      toast.error(t('auditNoUpiConfiguredSettings' as any));
      return;
    }
    const amt = parseFloat(upiInputAmount);
    if (isNaN(amt) || amt < 0) {
      toast.error(t('auditInvalidAmount' as any));
      return;
    }
    const expected = fund.isRecurring
      ? calculateExpectedAmountForPeriod(fund, selectedMemberForCollection, selectedPeriod)
      : (selectedMemberForCollection.expectedAmount ?? fund.defaultContributionAmount ?? 0);
    const existingPaid = getPeriodCollectedAmount(fund.contributions, selectedMemberForCollection.id, selectedPeriod);
    const status: ContributionStatus = expected > 0 && (existingPaid + amt) < expected ? 'Partial' : 'Paid';

    const newContribution: Contribution = {
      id: nanoid(),
      fundId: fund.id,
      memberId: selectedMemberForCollection.id,
      amount: amt,
      expectedAmount: expected,
      method: 'UPI',
      date: Date.now(),
      note: `UPI Collection (${selectedPeriod})`,
      status,
      verifiedBy: 'user_confirmed',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const next = appendActivity({
      ...fund,
      contributions: [newContribution, ...fund.contributions],
      members: fund.members.map(item => item.id === selectedMemberForCollection.id
        ? { ...item, creditBalance: getCreditAfterPayment(item, expected, existingPaid, amt), savedCollectionAmount: undefined }
        : item),
    }, t('auditUpiCollectionActivity' as any, { amount: amt, name: selectedMemberForCollection.name, period: selectedPeriod }));

    refresh(next);
    setSelectedMemberForCollection(undefined);
    setUpiInputAmount('');
    toast.success(t('auditCollectedUpi' as any, { name: selectedMemberForCollection.name, amount: amt }));
  };

  const handleBulkMemberCollect = (m: GroupFundMember) => {
    if (isSelectedPeriodClosed) {
      toast.error(t('auditMonthClosed' as any, { period: selectedPeriod }));
      return;
    }
    const amtStr = bulkAmounts[m.id] ?? '';
    const amt = parseFloat(amtStr);
    if (isNaN(amt) || amt < 0) {
      toast.error(t('auditMemberAmountRequired' as any, { name: m.name }));
      return;
    }
    const expected = fund.isRecurring
      ? calculateExpectedAmountForPeriod(fund, m, selectedPeriod)
      : (m.expectedAmount ?? fund.defaultContributionAmount ?? 0);
    const existingPaid = getPeriodCollectedAmount(fund.contributions, m.id, selectedPeriod);
    const status: ContributionStatus = expected > 0 && (existingPaid + amt) < expected ? 'Partial' : 'Paid';

    const newContribution: Contribution = {
      id: nanoid(),
      fundId: fund.id,
      memberId: m.id,
      amount: amt,
      expectedAmount: expected,
      method: 'UPI',
      date: Date.now(),
      note: `Bulk UPI Collection (${selectedPeriod})`,
      status,
      verifiedBy: 'user_confirmed',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const next = appendActivity({
      ...fund,
      contributions: [newContribution, ...fund.contributions],
      members: fund.members.map(item => item.id === m.id
        ? { ...item, creditBalance: getCreditAfterPayment(item, expected, existingPaid, amt), savedCollectionAmount: undefined }
        : item),
    }, t('auditBulkCollectionActivity' as any, { amount: amt, name: m.name, period: selectedPeriod }));

    refresh(next);
    toast.success(t('auditCollectedBulk' as any, { name: m.name, amount: amt }));
  };

  const handleUndoCollection = (memberId: string) => {
    if (isSelectedPeriodClosed) {
      toast.error(t('auditMonthClosed' as any, { period: selectedPeriod }));
      return;
    }
    const matching = fund.contributions.filter((c: Contribution) => c.memberId === memberId && c.status !== 'Cancelled' && (!c.note || c.note.includes(selectedPeriod)));
    if (matching.length === 0) {
      toast.info(t('auditNoActiveCollection' as any));
      return;
    }
    const targetId = matching[0].id;
    const next = appendActivity({
      ...fund,
      contributions: fund.contributions.map((c: Contribution) => c.id === targetId ? { ...c, status: 'Cancelled' as ContributionStatus } : c),
    }, t('auditUndidCollectionActivity' as any, { period: selectedPeriod }));
    refresh(next);
    toast.success(t('auditCollectionUndone' as any));
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim()) {
      toast.error(t('auditExpenseTitleRequiredMessage' as any));
      return;
    }
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error(t('auditInvalidAmount' as any));
      return;
    }

    const newExpense: GroupFundExpense = {
      id: nanoid(),
      fundId: fund.id,
      name: expenseTitle.trim(),
      category: expenseCategory,
      amount: amt,
      date: Date.now(),
      note: expenseNote.trim() || undefined,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const next = appendActivity({
      ...fund,
      expenses: [newExpense, ...(fund.expenses || [])],
    }, t('auditExpenseActivity' as any, { name: newExpense.name, amount: amt, category: groupFundOptionLabel(t, expenseCategory) }));

    refresh(next);
    setShowExpenseModal(false);
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseNote('');
    toast.success(t('auditExpenseSaved' as any));
  };

  const handleSendWhatsAppReminder = (m: GroupFundMember) => {
    const mobileNumber = m.mobileNumber?.trim() ?? '';
    const message = t('auditBulkContributionReminderMessage' as any, {
      name: m.name,
      fund: fund.name,
      period: selectedPeriod,
    });
    const url = generateGroupFundWhatsAppReminderUrl({
      fundName: fund.name,
      memberName: m.name,
      period: selectedPeriod,
      mobileNumber,
      message,
    });
    window.open(url, '_blank');
    toast.success(t('auditReminderOpened' as any, { name: m.name }));
  };

  const handleSendIndividualPaymentRequest = (m: GroupFundMember, amount: number) => {
    const upiIdConfig = fund.paymentConfig?.upiId?.trim();
    if (!upiIdConfig) {
      toast.error(t('auditNoUpiConfiguredSettings' as any));
      return;
    }
    if (amount <= 0) {
      handleSendWhatsAppReminder(m);
      return;
    }
    const url = generateGroupFundWhatsAppPaymentUrl({
      fundName: fund.name,
      memberName: m.name,
      amount,
      upiId: upiIdConfig,
      period: selectedPeriod,
      mobileNumber: m.mobileNumber?.trim() ?? '',
      confirmationMessage: t('auditPaymentConfirmationInstruction' as any),
      note: `Contribution - ${selectedPeriod}`,
    });
    window.open(url, '_blank');
    toast.success(t('auditPaymentLinkOpened' as any, { name: m.name }));
  };

  const handleSendIndividualCollectionMessage = (m: GroupFundMember, isCollected: boolean, paid: number) => {
    if (isCollected) {
      void handleSendThankYou(m, paid);
      return;
    }
    const savedAmount = getSavedCollectionAmount(m);
    if (savedAmount !== undefined && savedAmount > 0) {
      handleSendIndividualPaymentRequest(m, savedAmount);
      return;
    }
    handleSendWhatsAppReminder(m);
  };

  const handleSendThankYou = (m: GroupFundMember, amount: number) => {
    const message = generateGroupFundThankYouMessage({ fundName: fund.name, memberName: m.name, amount, period: selectedPeriod });
    const url = generateWhatsAppMessageUrl(m.mobileNumber, message);
    if (!normalizeWhatsAppNumber(m.mobileNumber) || !url) { toast.error(t('auditNoPhoneEmail' as any)); return; }
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) { toast.error(t('auditPopupBlocked' as any)); return; }
    setThankYouOpenedByMember(current => ({ ...current, [m.id]: true }));
    toast.success('WhatsApp opened');
  };

  const handleCloseSelectedCollection = () => {
    if (isSelectedPeriodClosed) return;
    if (!allCollectionMembersCollected) {
      toast.error(t('auditCloseCollectionNeedsAll' as any));
      return;
    }
    const next = appendActivity({
      ...fund,
      closedPeriods: closePeriod(closedPeriods, selectedPeriod),
    }, t('auditCollectionClosed' as any, { period: selectedPeriod }));
    refresh(next);
    toast.success(t('auditCollectionClosed' as any, { period: selectedPeriod }));
  };

  const handleUndoCloseSelectedCollection = () => {
    if (!isSelectedPeriodClosed) return;
    const next = appendActivity({
      ...fund,
      closedPeriods: reopenPeriod(closedPeriods, selectedPeriod),
    }, t('auditCollectionReopened' as any, { period: selectedPeriod }));
    refresh(next);
    toast.success(t('auditCollectionReopened' as any, { period: selectedPeriod }));
  };

  const handleGeneratePdfReport = (action: 'view' | 'print' | 'save' | 'share' = 'view') => {
    const reportTitle = `${fund.name} - ${selectedPeriod}`;
    const reportLogoUrl = new URL(KHARCHA_LOGO_LOCKUP, window.location.origin).href;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapePdfHtml(fund.name)} - ${escapePdfHtml(t('auditGroupFundLabel' as any))} &amp; ${escapePdfHtml(t('auditExpenseLedgerLabel' as any))} (${escapePdfHtml(selectedPeriod)})</title>
          <style>${PDF_LAYOUT_CSS}</style>
        </head>
        <body>
          <div class="report">
            <div class="report-header">
              <img class="report-logo" src="${escapePdfHtml(reportLogoUrl)}" alt="Kharcha" />
              <div class="report-heading">
                <h1>${escapePdfHtml(fund.name)}</h1>
                <p>${escapePdfHtml(t('auditPurposeReport' as any))}: ${escapePdfHtml(groupFundOptionLabel(t, fund.purpose))} (${escapePdfHtml(groupFundOptionLabel(t, fund.contributionType))}) ${fund.isRecurring ? `| ${escapePdfHtml(t('auditFrequencyShort' as any))}: ${escapePdfHtml(groupFundOptionLabel(t, fund.recurringFrequency))}` : ''} | ${escapePdfHtml(t('auditPeriodLabel' as any))}: ${escapePdfHtml(selectedPeriod)} | ${escapePdfHtml(t('auditGeneratedOn' as any))}: ${escapePdfHtml(new Date().toLocaleDateString())}</p>
              </div>
            </div>
          
          <div class="summary">
            <strong>${t('auditTotalCollected' as any)}:</strong> ₹${totalCollected.toLocaleString('en-IN')} | 
            <strong>${t('auditTotalExpenses' as any)}:</strong> ₹${totalExpenses.toLocaleString('en-IN')} | 
            <strong>${t('auditRemainingBalance' as any)}:</strong> ₹${remainingBalance.toLocaleString('en-IN')}
          </div>

          <h3>${t('auditCollectionSummaryReport' as any)}</h3>
          <table>
            <thead>
              <tr>
                <th colspan="1" style="width: 28%;">${t('auditMemberName' as any)}</th>
                <th colspan="1" style="width: 19%;">${t('auditMobile' as any)}</th>
                <th colspan="1" style="width: 15%;">${t('auditAmountPaid' as any)}</th>
                <th colspan="1" style="width: 16%;">${t('auditPaymentDate' as any)}</th>
                <th colspan="1" style="width: 10%;">${t('auditMethod' as any)}</th>
                <th colspan="1" style="width: 12%;">${t('auditStatus' as any)}</th>
              </tr>
            </thead>
            <tbody>
              ${fund.members.map((m: GroupFundMember) => {
                const mc = fund.contributions.filter((c: Contribution) => c.memberId === m.id && c.status !== 'Cancelled' && (!c.note || c.note.includes(selectedPeriod)));
                const paid = mc.reduce((s: number, c: Contribution) => s + c.amount, 0);
                const dateStr = mc.length > 0 ? new Date(mc[mc.length - 1].date).toLocaleDateString() : '-';
                const methodStr = mc.length > 0 ? groupFundOptionLabel(t, mc[mc.length - 1].method) : '-';
                const statusStr = getPeriodCollectionStatus(fund.contributions, m.id, selectedPeriod) === 'Collected' ? t('auditCollectedStatus' as any) : t('auditPending' as any);
                return `
                  <tr>
                    <td class="member-name">${escapePdfHtml(m.name)}</td>
                    <td class="mobile">${escapePdfHtml(m.mobileNumber || '-')}</td>
                    <td class="amount">${escapePdfHtml(mc.length > 0 ? `₹${paid}` : '-')}</td>
                    <td class="date">${escapePdfHtml(dateStr)}</td>
                    <td class="method">${escapePdfHtml(methodStr)}</td>
                    <td class="status">${escapePdfHtml(statusStr)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <h3>${t('auditExpenseLedgerReport' as any)}</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 27%;">${t('auditExpenseTitle' as any)}</th>
                <th style="width: 18%;">${t('auditCategory' as any)}</th>
                <th style="width: 16%;">${t('auditAmountPaid' as any)}</th>
                <th style="width: 16%;">${t('auditDate' as any)}</th>
                <th style="width: 23%;">${t('auditNote' as any)}</th>
              </tr>
            </thead>
            <tbody>
              ${activeExpenses.length > 0 ? activeExpenses.map((e: GroupFundExpense) => `
                <tr>
                  <td>${escapePdfHtml(e.name)}</td>
                  <td>${escapePdfHtml(groupFundOptionLabel(t, e.category))}</td>
                  <td>${escapePdfHtml(`₹${e.amount}`)}</td>
                  <td>${escapePdfHtml(new Date(e.date).toLocaleDateString())}</td>
                  <td class="expense-note">${escapePdfHtml(e.note || '-')}</td>
                </tr>
              `).join('') : `<tr><td colspan="5" style="text-align: center;">${t('auditNoExpensesRecorded' as any)}</td></tr>`}
            </tbody>
          </table>
          </div>
        </body>
      </html>
    `;

    const nativePdf = (window as Window & { KharchaPdf?: { showReport: (html: string, title: string, backLabel: string, printLabel: string, saveLabel: string, shareLabel: string) => boolean; showReportAction?: (html: string, title: string, backLabel: string, printLabel: string, saveLabel: string, shareLabel: string, action: string) => boolean } }).KharchaPdf;
    if (nativePdf && typeof nativePdf.showReport === 'function') {
      try {
        const opened = action !== 'view' && typeof nativePdf.showReportAction === 'function'
          ? nativePdf.showReportAction(htmlContent, reportTitle, t('auditPdfBack' as any), t('auditPdfPrint' as any), t('auditPdfSave' as any), t('sharedHomeShare' as any), action)
          : nativePdf.showReport(htmlContent, reportTitle, t('auditPdfBack' as any), t('auditPdfPrint' as any), t('auditPdfSave' as any), t('sharedHomeShare' as any));
        if (opened) {
          toast.success(t('auditPdfGenerated' as any));
          return;
        }
      } catch {
        // Keep the Android guard below from opening an external standalone page.
      }
    }

    const isAndroidShell = new URLSearchParams(window.location.search).get('android') === '1' || /KharchaAndroid/i.test(navigator.userAgent);
    if (isAndroidShell) {
      toast.error(t('auditPdfUnavailable' as any));
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error(t('auditPopupBlocked' as any));
      return;
    }
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      try {
        printWindow.print();
      } catch {
        toast.error(t('auditPdfUnavailable' as any));
      }
    }, 150);
    toast.success(t('auditPdfGenerated' as any));
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingMember) return;
    const latestFund = getGroupFundById(params.id) ?? fund;
    const trimmedName = memberName.trim();
    if (!trimmedName) {
      toast.error(t('fillRequired'));
      return;
    }
    const expectedAmount = memberExpected.trim() ? parseFloat(memberExpected) : undefined;
    if (expectedAmount !== undefined && (!Number.isFinite(expectedAmount) || expectedAmount < 0)) {
      toast.error(t('auditInvalidAmount' as any));
      return;
    }

    const normalizedStartDate = latestFund.isRecurring
      ? (memberStartDate || getMemberStartDateValue(latestFund, editingMember))
      : undefined;

    if (editingMember) {
      const duplicateName = latestFund.members.some(item => item.id !== editingMember.id && item.name.trim().toLowerCase() === trimmedName.toLowerCase());
      if (duplicateName) {
        toast.info(t('memberAlreadyExists'));
        return;
      }
      const members = latestFund.members.map(item => item.id === editingMember.id
        ? { ...item, name: trimmedName, mobileNumber: memberMobile.trim() || undefined, expectedAmount, startDate: normalizedStartDate, stopFrom: memberStopFrom || undefined, stopUntil: memberStopUntil || undefined }
        : item);
      const next = appendActivity({ ...latestFund, members }, `${t('edit')} ${trimmedName}`);
      refresh(next);
      setShowMemberModal(false);
      setEditingMember(undefined);
      setMemberName('');
      setMemberMobile('');
      setMemberExpected('');
      setMemberStartDate('');
      setMemberStopFrom('');
      setMemberStopUntil('');
      toast.success(t('edit'));
      return;
    }

    const incomingMember: GroupFundMember = {
      id: nanoid(),
      name: trimmedName,
      mobileNumber: memberMobile.trim() || undefined,
      expectedAmount,
      startDate: normalizedStartDate,
      stopFrom: memberStopFrom || undefined,
      stopUntil: memberStopUntil || undefined,
      isActive: true,
      createdAt: Date.now(),
    };
    const { members, added } = appendUniqueMembers(latestFund.members, [incomingMember]);
    if (added.length === 0) {
      toast.info(t('memberAlreadyExists'));
      return;
    }
    setIsSavingMember(true);
    try {
      const next = appendActivity({ ...latestFund, members }, t('auditMembersAdded' as any, { count: 1 }));
      refresh(next);
      setShowMemberModal(false);
      setMemberName('');
      setMemberMobile('');
      setMemberExpected('');
      setMemberStartDate('');
      setMemberStopFrom('');
      setMemberStopUntil('');
      toast.success(t('auditMembersAdded' as any, { count: 1 }));
    } finally {
      setIsSavingMember(false);
    }
  };

  const handlePickContacts = async () => {
    if (isImportingContacts) return;
    setIsImportingContacts(true);
    try {
      const contacts = await pickMultipleContacts();
      if (contacts && contacts.length > 0) {
        const latestFund = getGroupFundById(params.id) ?? fund;
        const incomingMembers: GroupFundMember[] = contacts
          .filter(contact => Boolean(contact.name?.trim()))
          .map(contact => ({
            id: nanoid(),
            name: contact.name!.trim(),
            mobileNumber: contact.tel ? formatPhoneNumber(contact.tel) : undefined,
            startDate: latestFund.isRecurring ? new Date().toISOString().slice(0, 10) : undefined,
            isActive: true,
            createdAt: Date.now(),
          }));
        const { members, added } = appendUniqueMembers(latestFund.members, incomingMembers);
        if (added.length > 0) {
          const next = appendActivity({
            ...latestFund,
            members,
          }, t('auditMembersAdded' as any, { count: added.length }));
          refresh(next);
          toast.success(t('auditMembersAdded' as any, { count: added.length }));
        } else {
          toast.info(t('auditNoNewContacts' as any));
        }
      }
    } catch {
      toast.error(t('failedContact'));
    } finally {
      setIsImportingContacts(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;
        const lines = text.split(/\r\n|\n/);
        const newMembers: GroupFundMember[] = [];
        const existingNames = new Set(fund.members.map((m: GroupFundMember) => m.name.toLowerCase()));

        for (const line of lines) {
          if (!line.trim()) continue;
          const parts = line.split(/,|\t/);
          const name = parts[0]?.trim()?.replace(/^["']|["']$/g, '');
          const mobile = parts[1]?.trim()?.replace(/^["']|["']$/g, '');
          if (name && name.toLowerCase() !== 'name' && !existingNames.has(name.toLowerCase())) {
            newMembers.push({
              id: nanoid(),
              name,
              mobileNumber: mobile ? formatPhoneNumber(mobile) : undefined,
              startDate: fund.isRecurring ? new Date().toISOString().slice(0, 10) : undefined,
              isActive: true,
              createdAt: Date.now(),
            });
            existingNames.add(name.toLowerCase());
          }
        }

        if (newMembers.length > 0) {
          const next = appendActivity({
            ...fund,
            members: [...fund.members, ...newMembers],
          }, t('auditImportedMembersFromFile' as any, { count: newMembers.length }));
          refresh(next);
          toast.success(t('auditImportedMembersFromFile' as any, { count: newMembers.length }));
        } else {
          toast.info(t('auditNoValidMembersInFile' as any));
        }
      } catch (err) {
        console.error(err);
        toast.error(t('auditFileParseFailed' as any));
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const next = appendActivity({
      ...fund,
      collectionStartDate: fund.isRecurring ? collectionStartDate || undefined : undefined,
      collectionPeriodMode: fund.isRecurring && fund.recurringFrequency !== 'Daily' ? collectionPeriodMode : undefined,
      collectionTiming: fund.isRecurring ? (collectionPeriodMode === 'past' ? 'previous' : 'advance') : undefined,
      paymentConfig: {
        ...(fund.paymentConfig ?? {}),
        upiId: upiId.trim() || undefined,
      },
    }, 'Updated payment configuration');
    refresh(next);
    toast.success('Settings saved successfully!');
  };

  const filteredMembers = fund.members.filter((m: GroupFundMember) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-kharcha-cream pb-12">
      {/* Header */}
      <AppSectionHeader
        title={fund.name}
        onBack={() => navigate('/group-funds')}
        backLabel={t('auditBackToKharcha' as any)}
        actions={<><Button variant="default" size="sm" onClick={() => setShowEditSync(true)} className="w-full rounded-xl bg-[#16834b] px-3 text-sm font-black text-white shadow-sm hover:bg-[#11663b]"><Share2 size={16} className="mr-1.5" /> {t('sharedHomeShare')}</Button><Button variant="outline" size="sm" onClick={() => setShowQrDialog(true)} className="w-full border border-[#d7e4dc] bg-white text-kharcha-navy hover:bg-gray-100 font-black shadow-sm"><QrCode size={16} className="mr-1" /> {t('auditQrCode' as any)}</Button></>}
      >
        <div className="mx-auto mt-3 max-w-5xl">
          <span className="inline-flex rounded-full bg-[#dff1e5] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#16834b]">
            {fund.isRecurring ? t('recurringCollection' as any) : t('pbOneTime' as any)}
          </span>
        </div>
        <div className="mx-auto mt-3 grid max-w-5xl grid-cols-2 gap-2 text-xs font-black sm:grid-cols-4">
          {[
            { id: 'overview', label: t('auditDashboardTab' as any), icon: Wallet },
            { id: 'collection', label: t('auditCollectionSummary' as any), icon: CheckCircle2 },
            { id: 'members', label: t('auditMembers' as any), icon: Users },
            { id: 'expenses', label: t('auditExpensesTab' as any), icon: Receipt },
            { id: 'settle', label: t('auditSettlementTab' as any), icon: Wallet },
            { id: 'reports', label: t('sharedHomeReports' as any), icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-center transition-all shadow-sm ${
                  active
                    ? 'border-[#16834b] bg-[#16834b] text-white font-black'
                    : 'border-[#d7e4dc] bg-white text-kharcha-navy font-bold hover:bg-gray-100'
                }`}
              >
                <Icon size={14} className={active ? 'text-white' : 'text-kharcha-navy'} /> <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </AppSectionHeader>
      <div className="mx-auto max-w-5xl px-4 pt-3 sm:pt-4">
        <EditSyncReviewBar contextType="group_fund" contextId={fund.id} />
        <EditSyncBackBar contextType="group_fund" contextId={fund.id} snapshot={fund} />
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-4 space-y-4">
        {activeTab === 'collection' && (
          <div className="space-y-4">
            {/* Top Bar with Auto-Generated Period Selector, WhatsApp Reminders, PDF Report & Bulk QR */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-[#d7e4dc] p-4 rounded-2xl shadow-sm">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-kharcha-navy">{t('auditTotalCollected' as any)} ({selectedPeriod})</p>
                <h2 className="text-2xl font-black text-[#16834b] sm:text-3xl">₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
                {isSelectedPeriodClosed && <p className="mt-1 text-xs font-black text-[#16834b]">{t('auditMonthClosed' as any, { period: selectedPeriod })}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[180px] border border-[#d7e4dc] rounded-xl font-black bg-white text-kharcha-navy shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[#d7e4dc] font-bold text-kharcha-navy">
                    {collectionPeriods.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={isSelectedPeriodClosed ? handleUndoCloseSelectedCollection : handleCloseSelectedCollection}
                  variant="outline"
                  disabled={!isSelectedPeriodClosed && !allCollectionMembersCollected}
                  title={!isSelectedPeriodClosed && !allCollectionMembersCollected ? t('auditCloseCollectionNeedsAll' as any) : undefined}
                  className={`border border-[#d7e4dc] font-black rounded-xl shadow-sm ${isSelectedPeriodClosed ? 'bg-green-100 text-[#16834b] hover:bg-green-200' : 'bg-white text-kharcha-navy hover:bg-green-50'} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {isSelectedPeriodClosed ? <RotateCcw size={16} className="mr-1" /> : <CheckCircle2 size={16} className="mr-1 text-[#16834b]" />}
                  {t(isSelectedPeriodClosed ? 'auditUndoCloseCollection' : 'auditCloseCollection' as any)}
                </Button>

                <Button onClick={handleOpenBulkMessageDialog} disabled={isSelectedPeriodClosed} variant="outline" className="border border-[#d7e4dc] bg-white text-kharcha-navy font-black rounded-xl shadow-sm hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50">
                  <MessageSquare size={16} className="mr-1 text-[#16834b]" /> {t('auditSendBulkMessage' as any)}
                </Button>

                <Button onClick={handleOpenBulkCollection} disabled={isSelectedPeriodClosed} className="bg-[#e87817] text-white border border-[#d7e4dc] font-black rounded-xl shadow-sm hover:bg-[#d06713] disabled:cursor-not-allowed disabled:opacity-50">
                  <QrCode size={16} className="mr-1" /> {t('auditBulkQr' as any)}
                </Button>
              </div>
            </div>

            {/* Search Member Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-kharcha-navy" size={18} />
              <Input
                placeholder={`🔍 ${t('auditSearchMember' as any)}`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 border border-[#d7e4dc] rounded-xl bg-white font-bold text-kharcha-navy placeholder:text-gray-500 shadow-sm"
              />
            </div>

            {/* Member List with WhatsApp Payment Link Reminder, Undo & Collect Amount */}
            <div className="space-y-2">
              <h3 className="font-black text-kharcha-navy text-sm uppercase tracking-wide">{t('auditMembersIndividualCollection' as any)} ({selectedPeriod})</h3>
              {filteredMembers.length === 0 ? (
                <Card className="rounded-2xl border border-[#d7e4dc] p-8 text-center bg-white shadow-sm">
                  <p className="text-kharcha-navy font-bold mb-3">{t('auditNoMembersAdded' as any)}</p>
                  <Button onClick={() => setActiveTab('members')} className="bg-black text-white font-black rounded-xl border border-[#d7e4dc] shadow-sm">{t('auditAddMembers' as any)}</Button>
                </Card>
              ) : (
                filteredMembers.map((m: GroupFundMember) => {
                  const memberContributions = getMemberPeriodContributions(m.id);
                  const paid = memberContributions.reduce((s: number, c: Contribution) => s + c.amount, 0);
                  const expected = calculateExpectedAmountForPeriod(fund, m, selectedPeriod);
                  const isCollected = memberContributions.length > 0;
                  const lastPayment = memberContributions.length > 0 ? memberContributions[memberContributions.length - 1] : undefined;

                  return (
                    <Card
                      key={m.id}
                      className="rounded-xl border border-[#d7e4dc] bg-white p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-kharcha-navy text-base">{m.name}</h4>
                          <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border border-[#d7e4dc] ${isCollected ? 'bg-green-100 text-[#16834b]' : 'bg-orange-100 text-[#e87817]'}`}>
                            {isCollected ? `✓ ${t('auditCollected' as any)}` : t('auditPending' as any)}
                          </span>
                        </div>
                        <p className="text-xs text-kharcha-navy font-medium mt-0.5">
                          {isCollected ? <><span>{t('auditPaid' as any)}:</span> <span className="font-black text-[#16834b]">₹{paid.toLocaleString('en-IN')}</span></> : <><span>Expected Amount:</span> <span className="font-black text-[#e87817]">₹{expected.toLocaleString('en-IN')}</span></>}
                          {lastPayment && isCollected && <span className="text-gray-600 ml-1">({t('auditPaymentMethodOnDate' as any, { method: groupFundOptionLabel(t, lastPayment.method), date: new Date(lastPayment.date).toLocaleDateString() })})</span>}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendIndividualCollectionMessage(m, isCollected, paid)}
                          className="border border-[#d7e4dc] bg-white text-kharcha-navy font-black h-10 px-3 text-xs rounded-xl shadow-sm hover:bg-green-50"
                          title={isCollected ? 'Open WhatsApp thank-you again' : t((getSavedCollectionAmount(m) !== undefined && getSavedCollectionAmount(m)! > 0 ? 'auditPaymentRequest' : 'auditSendWhatsAppReminder') as any)}
                        >
                          <MessageSquare size={14} className="mr-1 text-[#16834b]" /> {isCollected ? (thankYouOpenedByMember[m.id] ? 'Opened ✓' : 'Thank You') : t((getSavedCollectionAmount(m) !== undefined && getSavedCollectionAmount(m)! > 0 ? 'auditPaymentRequest' : 'auditSendWhatsAppReminder') as any)}
                        </Button>

                        {isCollected ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUndoCollection(m.id)}
                            className="border border-[#d7e4dc] bg-white text-red-600 font-black h-10 px-3 text-xs rounded-xl shadow-sm hover:bg-red-50"
                            title={t('auditUndoRecollect' as any)}
                          >
                            <RotateCcw size={14} className="mr-1" /> {t('auditUndoRecollect' as any)}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isSelectedPeriodClosed}
                            onClick={() => {
                              setSelectedMemberForCollection(m);
                              setCollectionMethod('UPI');
                              const defaultExpected = fund.isRecurring && fund.amountType === 'Default Amount'
                                ? calculateExpectedAmountForPeriod(fund, m, selectedPeriod)
                                : undefined;
                              const defaultCollectionAmount = defaultExpected !== undefined && Number.isFinite(defaultExpected) && defaultExpected > 0
                                ? String(defaultExpected)
                                : '';
                              setCollectionAmount(defaultCollectionAmount);
                              setUpiInputAmount(defaultCollectionAmount);
                              setSavedAmountInput(getSavedCollectionAmount(m)?.toString() ?? '');
                            }}
                            className="bg-[#16834b] text-white font-black h-10 px-4 text-xs rounded-xl hover:bg-green-700 border border-[#d7e4dc] shadow-sm"
                          >
                            {t('auditCollectAmountButton' as any)}
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* EXPENSES TAB */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-[#d7e4dc] p-4 rounded-2xl shadow-sm">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-kharcha-navy">{t('auditTotalFundExpensesLabel' as any)}</p>
                <h2 className="text-2xl font-black text-red-600 sm:text-3xl">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
              </div>
              <Button onClick={() => setShowExpenseModal(true)} className="bg-black text-white border border-[#d7e4dc] font-black rounded-xl shadow-sm hover:bg-gray-800">
                <Receipt size={16} className="mr-1" /> {t('auditAddExpense' as any)}
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-black text-kharcha-navy text-sm uppercase tracking-wide">{t('auditExpenseLedgerLabel' as any)}</h3>
              {activeExpenses.length === 0 ? (
                <Card className="rounded-2xl border border-[#d7e4dc] p-8 text-center bg-white shadow-sm">
                  <p className="text-kharcha-navy font-bold mb-3">{t('auditNoFundExpensesYet' as any)}</p>
                  <Button onClick={() => setShowExpenseModal(true)} className="bg-black text-white font-black rounded-xl border border-[#d7e4dc] shadow-sm">{t('auditRecordFirstFundExpense' as any)}</Button>
                </Card>
              ) : (
                activeExpenses.map((exp: GroupFundExpense) => (
                  <Card key={exp.id} className="rounded-xl border border-[#d7e4dc] bg-white p-4 flex justify-between items-center shadow-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-kharcha-navy text-base">{exp.name}</h4>
                        <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full border border-[#d7e4dc] bg-amber-100 text-amber-800">
                          {exp.category}
                        </span>
                      </div>
                      <p className="text-xs text-kharcha-navy font-medium mt-1">
                        {exp.note ? `${exp.note} — ` : ''}{new Date(exp.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-red-600 text-lg">₹{exp.amount.toLocaleString('en-IN')}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => requestDelete({
                          title: t('auditDeleteExpenseConfirmShort' as any, { name: exp.name }),
                          message: t('auditActionCannotUndo' as any),
                          onConfirm: () => {
                            const next = appendActivity({
                              ...fund,
                              expenses: (fund.expenses || []).map((item: GroupFundExpense) => item.id === exp.id ? { ...item, status: 'cancelled' as const } : item),
                            }, t('auditExpenseDeleted' as any) + `: ${exp.name}`);
                            refresh(next);
                            toast.success(t('auditExpenseDeleted' as any));
                          },
                        })}
                        className="text-red-600 hover:text-red-700 font-bold"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="rounded-2xl border border-[#d7e4dc] bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wider text-kharcha-navy">{t('auditTotalCollected' as any)}</p>
                <h3 className="text-2xl font-black text-[#16834b] mt-1">₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
              </Card>
              <Card className="rounded-2xl border border-[#d7e4dc] bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wider text-kharcha-navy">{t('auditTotalExpenses' as any)}</p>
                <h3 className="text-2xl font-black text-red-600 mt-1">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
              </Card>
              <Card className="rounded-2xl border border-[#d7e4dc] bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wider text-kharcha-navy">{t('auditRemainingBalance' as any)}</p>
                <h3 className={`text-2xl font-black mt-1 ${remainingBalance >= 0 ? 'text-[#16834b]' : 'text-red-600'}`}>
                  ₹{remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
              </Card>
            </div>

            <Card className="rounded-2xl border border-[#d7e4dc] bg-white p-4 shadow-sm">
              <h3 className="font-black text-kharcha-navy flex items-center gap-2"><History size={18} /> {t('auditFundActivity' as any)}</h3>
              <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                {(fund.activity || []).length > 0 ? (
                  fund.activity!.map((act: any) => (
                    <div key={act.id} className="text-xs border-b pb-2 flex justify-between items-center font-medium text-kharcha-navy">
                      <span>{act.message}</span>
                      <span className="text-gray-500">{new Date(act.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-kharcha-navy font-medium">{t('auditNoActivity' as any)}</p>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'settle' && (
          <div className="space-y-4">
            <Card className="rounded-2xl border border-[#d7e4dc] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-kharcha-navy">{t('auditSettlementTab' as any)}</h2>
              <p className="mt-1 text-sm font-medium text-gray-600">{t('auditRemainingBalance' as any)}</p>
              <p className={`mt-2 text-3xl font-black ${remainingBalance >= 0 ? 'text-[#16834b]' : 'text-red-600'}`}>
                ₹{remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#d7e4dc] bg-white p-3">
                  <p className="text-xs font-black uppercase tracking-wider text-kharcha-navy">{t('auditTotalCollected' as any)}</p>
                  <p className="mt-1 text-lg font-black text-[#16834b]">₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-xl border border-[#d7e4dc] bg-white p-3">
                  <p className="text-xs font-black uppercase tracking-wider text-kharcha-navy">{t('auditTotalExpenses' as any)}</p>
                  <p className="mt-1 text-lg font-black text-red-600">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            <Card className="rounded-2xl border border-[#d7e4dc] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-kharcha-navy">{t('sharedHomeReports' as any)}</h2>
                  <p className="text-sm font-medium text-gray-600">{t('auditPeriodLabel' as any)}: {selectedPeriod}</p>
                </div>
                <span className="rounded-full bg-[#dff1e5] px-2.5 py-1 text-xs font-black text-[#16834b]">{fund.isRecurring ? t('recurringCollection' as any) : t('pbOneTime' as any)}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button type="button" onClick={() => handleGeneratePdfReport('view')} variant="outline" className="min-h-10 rounded-xl border border-[#d7e4dc] bg-white font-black text-kharcha-navy hover:bg-gray-100">
                  <FileText size={16} className="mr-1 text-[#16834b]" /> {t('auditPdfReport' as any)}
                </Button>
                <Button type="button" onClick={() => handleGeneratePdfReport('print')} variant="outline" className="min-h-10 rounded-xl border border-[#d7e4dc] bg-white font-black text-kharcha-navy hover:bg-gray-100">
                  {t('auditPdfPrint' as any)}
                </Button>
                <Button type="button" onClick={() => handleGeneratePdfReport('save')} variant="outline" className="min-h-10 rounded-xl border border-[#d7e4dc] bg-white font-black text-kharcha-navy hover:bg-gray-100">
                  {t('auditPdfSave' as any)}
                </Button>
                <Button type="button" onClick={() => handleGeneratePdfReport('share')} variant="outline" className="min-h-10 rounded-xl border border-[#d7e4dc] bg-white font-black text-kharcha-navy hover:bg-gray-100">
                  {t('sharedHomeShare' as any)}
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#d7e4dc] bg-white p-3"><p className="text-xs font-black uppercase tracking-wider text-kharcha-navy">{t('auditTotalCollected' as any)}</p><p className="mt-1 text-lg font-black text-[#16834b]">₹{totalCollected.toLocaleString('en-IN')}</p></div>
                <div className="rounded-xl border border-[#d7e4dc] bg-white p-3"><p className="text-xs font-black uppercase tracking-wider text-kharcha-navy">{t('auditTotalExpenses' as any)}</p><p className="mt-1 text-lg font-black text-red-600">₹{totalExpenses.toLocaleString('en-IN')}</p></div>
                <div className="rounded-xl border border-[#d7e4dc] bg-white p-3"><p className="text-xs font-black uppercase tracking-wider text-kharcha-navy">{t('auditRemainingBalance' as any)}</p><p className={`mt-1 text-lg font-black ${remainingBalance >= 0 ? 'text-[#16834b]' : 'text-red-600'}`}>₹{remainingBalance.toLocaleString('en-IN')}</p></div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            <Card className="rounded-2xl border border-[#d7e4dc] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-kharcha-navy mb-4">{t('auditFundUpiSettingsTitle' as any)}</h2>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                {fund.isRecurring && (
                  <div>
                    <Label htmlFor="fund-collection-start-date" className="font-black text-kharcha-navy">{t('auditCollectionStartDate' as any)}</Label>
                    <Input
                      id="fund-collection-start-date"
                      type="date"
                      value={collectionStartDate}
                      onChange={e => setCollectionStartDate(e.target.value)}
                      className="border border-[#d7e4dc] rounded-lg mt-1 text-kharcha-navy font-bold bg-white shadow-sm"
                    />
                    <p className="mt-1 text-xs text-gray-600">{t('auditCollectionStartDateHelp' as any)}</p>
                    {fund.recurringFrequency !== 'Daily' && (
                      <div className="mt-3">
                        <Label className="font-black text-kharcha-navy">{t('auditCollectionTiming' as any)}</Label>
                        <div className="mt-1 grid min-w-0 grid-cols-2 gap-2">
                          {(['past', 'future'] as const).map(mode => (
                            <button key={mode} type="button" onClick={() => setCollectionPeriodMode(mode)} className={`min-w-0 break-words rounded-xl border border-[#d7e4dc] px-2 py-2 text-sm font-black leading-tight shadow-sm ${collectionPeriodMode === mode ? 'bg-[#16834b] text-white' : 'bg-white text-kharcha-navy hover:bg-green-50'}`}>
                              {mode === 'past' ? t('auditPreviousPeriod' as any) : t('auditCollectInAdvance' as any)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <Label htmlFor="fund-upi" className="font-black text-kharcha-navy">{t('auditFundUpiSettingsLabel' as any)}</Label>
                  <Input
                    id="fund-upi"
                    placeholder={t('auditFundUpiPlaceholder' as any)}
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    className="border border-[#d7e4dc] rounded-lg mt-1 text-kharcha-navy font-bold bg-white shadow-sm"
                  />
                </div>
                <Button type="submit" className="bg-black text-white font-black rounded-xl border border-[#d7e4dc] shadow-sm hover:bg-gray-800">{t('auditSaveSettings' as any)}</Button>
              </form>
            </Card>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-[#d7e4dc] p-4 rounded-2xl shadow-sm">
              <div>
                <h2 className="text-lg font-black text-kharcha-navy">{t('auditFundMembersTitle' as any, { count: fund.members.length })}</h2>
                <p className="text-xs text-kharcha-navy font-medium">{t('auditFundMembersDescription' as any)}</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv, .txt, .xls, .xlsx"
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="border border-[#d7e4dc] font-black rounded-xl bg-white text-kharcha-navy hover:bg-gray-100 flex-1 sm:flex-none shadow-sm">
                  <Upload size={16} className="mr-1" /> {t('auditImportFromLocal' as any)}
                </Button>
                <Button onClick={handlePickContacts} disabled={isImportingContacts} variant="outline" className="border border-[#d7e4dc] font-black rounded-xl bg-white text-kharcha-navy hover:bg-gray-100 disabled:cursor-wait disabled:opacity-70 flex-1 sm:flex-none shadow-sm">
                  {isImportingContacts ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Phone size={16} className="mr-1" />}
                  {isImportingContacts ? t('picking') : t('auditImportContacts' as any)}
                </Button>
                <Button onClick={() => { setEditingMember(undefined); setShowMemberModal(true); }} className="bg-black text-white border border-[#d7e4dc] font-black rounded-xl flex-1 sm:flex-none shadow-sm hover:bg-gray-800">
                  <UserPlus size={16} className="mr-1" /> {t('auditAddManually' as any)}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {fund.members.length === 0 ? (
                <Card className="col-span-full rounded-2xl border border-[#d7e4dc] p-8 text-center bg-white shadow-sm">
                  <p className="text-kharcha-navy font-bold mb-3">{t('auditNoMembersFundYet' as any)}</p>
                  <div className="flex justify-center gap-2">
                    <Button onClick={() => { setEditingMember(undefined); setShowMemberModal(true); }} className="bg-black text-white font-black rounded-xl border border-[#d7e4dc] shadow-sm">{t('auditAddManually' as any)}</Button>
                    <Button onClick={handlePickContacts} disabled={isImportingContacts} variant="outline" className="border border-[#d7e4dc] font-black rounded-xl bg-white text-kharcha-navy hover:bg-gray-100 disabled:cursor-wait disabled:opacity-70 shadow-sm">
                      {isImportingContacts ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Phone size={16} className="mr-1" />}
                      {isImportingContacts ? t('picking') : t('auditImportContacts' as any)}
                    </Button>
                  </div>
                </Card>
              ) : (
                fund.members.map((m: GroupFundMember) => {
                  const paid = fund.contributions.filter((c: Contribution) => c.memberId === m.id && c.status !== 'Cancelled').reduce((s: number, c: Contribution) => s + c.amount, 0);
                  const memberJoinDate = new Date(`${getMemberStartDateValue(fund, m)}T00:00:00`);
                  const configuredCollectionReference = collectionStartDate || fund.collectionStartDate || collectionDate || new Date().toISOString().slice(0, 10);
                  const memberCollectionDate = new Date(`${configuredCollectionReference}T00:00:00`);
                  const configuredExpected = fund.isRecurring && fund.amountType === 'Default Amount' && !Number.isNaN(memberJoinDate.getTime())
                    ? calculateMemberAddExpectedAmountForConfiguredPeriod(
                        { ...fund, collectionPeriodMode },
                        m,
                        memberJoinDate,
                        Number.isNaN(memberCollectionDate.getTime()) ? new Date() : memberCollectionDate,
                      )
                    : undefined;
                  const expected = fund.isRecurring && fund.amountType === 'Default Amount'
                    ? (configuredExpected ?? 0)
                    : (m.expectedAmount ?? (fund.isRecurring ? calculateExpectedAmountForPeriod(fund, m, selectedPeriod) : fund.defaultContributionAmount));
                  return (
                    <Card
                      key={m.id}
                      className="rounded-2xl border border-[#d7e4dc] bg-white p-4 flex justify-between items-start shadow-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-kharcha-navy text-lg">{m.name}</h3>
                          {fund.isRecurring && (
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-[#d7e4dc] ${m.recurringActive !== false ? 'bg-green-100 text-[#16834b]' : 'bg-red-100 text-red-600'}`}>
                              {m.recurringActive !== false ? t('auditRecurringActive' as any) : t('auditRecurringStopped' as any)}
                            </span>
                          )}
                        </div>
                        {m.mobileNumber && <p className="text-xs text-kharcha-navy font-medium">{t('auditMobileLabel' as any)}: {m.mobileNumber}</p>}
                        {fund.isRecurring && <p className="text-xs text-kharcha-navy font-medium">{t('auditMemberStartDate' as any)}: {getMemberStartDateValue(fund, m)}</p>}
                        <p className="mt-2 text-sm font-black text-[#16834b]">{t('auditExpectedContribution' as any)}: ₹{expected.toLocaleString('en-IN')}</p>
                        <p className="text-xs font-black text-[#16834b]">{t('auditTotalPaid' as any)}: ₹{paid.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {fund.isRecurring && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const nextActive = m.recurringActive === false ? true : false;
                              const updatedMembers = fund.members.map(item => item.id === m.id ? { ...item, recurringActive: nextActive } : item);
                              const next = appendActivity({
                                ...fund,
                                members: updatedMembers,
                              }, `${nextActive ? t('auditResumeRecurring' as any) : t('auditStopRecurring' as any)} recurring collection for ${m.name}`);
                              refresh(next);
                              toast.success(`${t('auditRecurringCollection' as any)} ${nextActive ? t('auditResumeRecurring' as any).toLowerCase() : t('auditStopRecurring' as any).toLowerCase()} for ${m.name}`);
                            }}
                            className={`border border-[#d7e4dc] text-xs font-black h-8 px-2.5 rounded-lg shadow-sm ${
                              m.recurringActive !== false ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-[#16834b] hover:bg-green-100'
                            }`}
                          >
                            {m.recurringActive !== false ? t('auditStopRecurring' as any) : t('auditResumeRecurring' as any)}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`${t('edit')} ${m.name}`}
                          title={`${t('edit')} ${m.name}`}
                          onClick={() => {
                            setEditingMember(m);
                            setMemberName(m.name);
                            setMemberMobile(m.mobileNumber || '');
                            setMemberExpected(fund.isRecurring && fund.amountType === 'Default Amount' ? '' : (m.expectedAmount !== undefined ? String(m.expectedAmount) : ''));
                            setMemberStartDate(fund.isRecurring ? getMemberStartDateValue(fund, m) : '');
                            setMemberStopFrom(m.stopFrom || '');
                            setMemberStopUntil(m.stopUntil || '');
                            setShowMemberModal(true);
                          }}
                          className="text-kharcha-navy hover:text-[#16834b] font-bold"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => requestDelete({
                            title: t('auditRemoveMemberConfirmShort' as any, { name: m.name }),
                            message: t('auditActionCannotUndo' as any),
                            onConfirm: () => {
                              const next = appendActivity({
                                ...fund,
                                members: fund.members.filter((item: GroupFundMember) => item.id !== m.id),
                              }, t('auditMemberRemoved' as any) + `: ${m.name}`);
                              refresh(next);
                              toast.success(t('auditMemberRemoved' as any));
                            },
                          })}
                          className="text-red-600 hover:text-red-700 font-bold"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </Card>
                  );
                })
                            )}
            </div>

          </div>
        )}
      </main>

      {/* RECURRING COLLECTION REMINDER POPUP MODAL */}
      <Dialog open={showRecurringReminderModal} onOpenChange={setShowRecurringReminderModal}>
        <DialogContent className={`border border-[#d7e4dc] rounded-2xl max-w-sm text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${reminderInfo.isUrgent ? 'bg-red-50' : 'bg-white'}`}>
          <DialogHeader className="items-center">
            <div className={`w-12 h-12 rounded-full border border-[#d7e4dc] flex items-center justify-center mb-2 shadow-sm ${reminderInfo.isUrgent ? 'bg-red-600 text-white' : 'bg-[#16834b] text-white'}`}>
              <AlertCircle size={24} />
            </div>
            <DialogTitle className={`font-black text-xl ${reminderInfo.isUrgent ? 'text-red-700' : 'text-kharcha-navy'}`}>
              {reminderInfo.title}
            </DialogTitle>
            <DialogDescription className="text-kharcha-navy font-bold text-sm mt-2">
              {reminderInfo.message}
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-white border border-[#d7e4dc] rounded-xl my-3 shadow-sm">
            <p className="text-xs font-black uppercase text-gray-500">{t('auditFundNameShort' as any)}</p>
            <p className="font-black text-kharcha-navy text-base">{fund.name}</p>
            <p className="text-xs font-black uppercase text-gray-500 mt-2">{t('auditFrequencyShort' as any)}</p>
            <p className="font-black text-[#16834b] text-sm">{groupFundOptionLabel(t, fund.recurringFrequency)}</p>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {reminderInfo.isUrgent && (
              <div className="w-full bg-red-600 text-white font-black py-2.5 px-3 rounded-xl border border-[#d7e4dc] text-xs uppercase tracking-wide shadow-sm">
                {t('auditInformUrgently' as any)}
              </div>
            )}
            <Button
              onClick={() => setShowRecurringReminderModal(false)}
              className="w-full bg-black text-white font-black rounded-xl border border-[#d7e4dc] shadow-sm hover:bg-gray-800 py-3"
            >
              OK, Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* INDIVIDUAL COLLECT AMOUNT MODAL */}
      <Dialog open={!!selectedMemberForCollection} onOpenChange={(open) => !open && setSelectedMemberForCollection(undefined)}>
        <DialogContent className="bg-white border border-[#d7e4dc] rounded-2xl max-w-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          {selectedMemberForCollection && (
            <>
              <DialogHeader>
                <p className="text-xs font-black uppercase tracking-wider text-kharcha-navy">{t('auditCollectAmount' as any)} ({selectedPeriod})</p>
                <DialogTitle className="font-black text-2xl text-kharcha-navy">{selectedMemberForCollection.name}</DialogTitle>
                <DialogDescription className="text-kharcha-navy font-bold">{t('auditHowCollect' as any)}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-2">
                <div className="rounded-xl border border-[#d7e4dc] bg-green-50 p-3 shadow-sm">
                  <Label className="font-black text-kharcha-navy">Save Amount</Label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder={t('auditSavedAmountPlaceholder' as any)}
                      value={savedAmountInput}
                      onChange={e => setSavedAmountInput(e.target.value)}
                      className="border border-[#d7e4dc] rounded-lg font-black text-kharcha-navy bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    />
                    <Button
                      type="button"
                      onClick={handleSaveMemberAmount}
                      className="shrink-0 bg-black text-white border border-[#d7e4dc] font-black rounded-lg shadow-sm hover:bg-gray-800"
                    >
                      {t('auditDone' as any)}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    onClick={() => setCollectionMethod('UPI')}
                    className={`border border-[#d7e4dc] font-black py-3 rounded-xl transition-all shadow-sm ${
                      collectionMethod === 'UPI'
                        ? 'bg-[#16834b] text-white scale-[1.02] shadow-sm'
                        : 'bg-white text-kharcha-navy hover:bg-gray-100'
                    }`}
                  >
                    {t('auditUpiId' as any)}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setCollectionMethod('Cash')}
                    className={`border border-[#d7e4dc] font-black py-3 rounded-xl transition-all shadow-sm ${
                      collectionMethod === 'Cash'
                        ? 'bg-[#16834b] text-white scale-[1.02] shadow-sm'
                        : 'bg-white text-kharcha-navy hover:bg-gray-100'
                    }`}
                  >
                    {t('auditCash' as any)}
                  </Button>
                </div>

                {collectionMethod === 'Cash' ? (
                  <div className="space-y-2">
                    <Label className="font-black text-kharcha-navy">{t('auditAmount' as any)}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder={`${t('auditAmount' as any)} (e.g. 500)`}
                      value={collectionAmount}
                      onChange={e => setCollectionAmount(e.target.value)}
                      className="border border-[#d7e4dc] rounded-lg font-black text-xl text-kharcha-navy bg-white shadow-sm"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 border border-[#d7e4dc] rounded-xl text-center shadow-sm">
                      <p className="text-xs font-black text-kharcha-navy mb-1">{t('auditConfiguredUpiQr' as any)}</p>
                      {fund.paymentConfig?.upiId ? (
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`upi://pay?pa=${fund.paymentConfig.upiId}&pn=${encodeURIComponent(fund.name)}&am=${upiInputAmount}&tn=${encodeURIComponent(`Collection - ${selectedMemberForCollection.name}`)}`)}`}
                          alt={t('auditUpiQrAlt' as any, { name: fund.name })}
                          className="w-32 h-32 mx-auto border border-[#d7e4dc] bg-white p-1 rounded-lg"
                        />
                      ) : (
                        <p className="text-xs text-red-600 font-bold py-4">{t('auditNoUpiConfiguredSettings' as any)}</p>
                      )}
                      <p className="text-xs font-black text-kharcha-navy mt-2">{fund.paymentConfig?.upiId}</p>
                    </div>
                    <div>
                      <Label className="font-black text-kharcha-navy">{t('auditAmount' as any)}</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder={`${t('auditAmount' as any)} (e.g. 500)`}
                        value={upiInputAmount}
                        onChange={e => setUpiInputAmount(e.target.value)}
                        className="border border-[#d7e4dc] rounded-lg font-black text-xl text-kharcha-navy bg-white shadow-sm"
                        autoFocus
                      />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={isSelectedPeriodClosed ? handleUndoCloseSelectedCollection : handleCloseSelectedCollection}
                  disabled={!isSelectedPeriodClosed && !allCollectionMembersCollected}
                  className={`border border-[#d7e4dc] font-black rounded-xl ${isSelectedPeriodClosed ? 'bg-green-100 text-[#16834b]' : 'bg-white text-kharcha-navy'} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {t(isSelectedPeriodClosed ? 'auditUndoCloseCollection' : 'auditCloseCollection' as any)}
                </Button>
                <Button variant="outline" onClick={() => setSelectedMemberForCollection(undefined)} className="border border-[#d7e4dc] font-black rounded-xl flex-1 bg-white text-kharcha-navy hover:bg-gray-100 shadow-sm">{t('auditCancel' as any)}</Button>
                {collectionMethod === 'Cash' ? (
                  <Button onClick={handleCashCollectionDone} className="bg-[#16834b] text-white font-black rounded-xl flex-1 hover:bg-green-700 border border-[#d7e4dc] shadow-sm">{t('auditDone' as any)}</Button>
                ) : (
                  <Button onClick={handleUpiCollectionDone} className="bg-[#16834b] text-white font-black rounded-xl flex-1 hover:bg-green-700 border border-[#d7e4dc] shadow-sm">{t('auditDone' as any)}</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* RECORD EXPENSE MODAL */}
      <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
        <DialogContent className="bg-white border border-[#d7e4dc] rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle className="font-black text-xl text-kharcha-navy">{t('auditRecordFundExpense' as any)}</DialogTitle>
            <DialogDescription className="text-kharcha-navy font-bold">{t('auditRecordFundExpenseDescription' as any)}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveExpense} className="space-y-4">
            <div>
              <Label className="font-black text-kharcha-navy">{t('auditExpenseTitleRequired' as any)}</Label>
              <Input
                placeholder={t('auditExpenseTitlePlaceholder' as any)}
                value={expenseTitle}
                onChange={e => setExpenseTitle(e.target.value)}
                className="border border-[#d7e4dc] rounded-lg mt-1 text-kharcha-navy font-bold bg-white shadow-sm"
                required
              />
            </div>
            <div>
              <Label className="font-black text-kharcha-navy">{t('auditCategory' as any)}</Label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger className="border border-[#d7e4dc] rounded-lg mt-1 text-kharcha-navy font-bold bg-white shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#d7e4dc] font-bold text-kharcha-navy">
                  <SelectItem value="Food">{t('auditFoodSnacks' as any)}</SelectItem>
                  <SelectItem value="Equipment">{t('auditEquipment' as any)}</SelectItem>
                  <SelectItem value="Maintenance">{t('auditMaintenance' as any)}</SelectItem>
                  <SelectItem value="Event">{t('auditEventCelebration' as any)}</SelectItem>
                  <SelectItem value="Utility">{t('auditUtility' as any)}</SelectItem>
                  <SelectItem value="Other">{t('auditOther' as any)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-black text-kharcha-navy">{t('auditAmountRequired' as any)}</Label>
              <Input
                type="number"
                step="any"
                placeholder="1500"
                value={expenseAmount}
                onChange={e => setExpenseAmount(e.target.value)}
                className="border border-[#d7e4dc] rounded-lg mt-1 text-kharcha-navy font-bold bg-white shadow-sm"
                required
              />
            </div>
            <div>
              <Label className="font-black text-kharcha-navy">{t('auditNoteDescriptionOptional' as any)}</Label>
              <Input
                placeholder={t('auditExpenseNotePlaceholder' as any)}
                value={expenseNote}
                onChange={e => setExpenseNote(e.target.value)}
                className="border border-[#d7e4dc] rounded-lg mt-1 text-kharcha-navy font-bold bg-white shadow-sm"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowExpenseModal(false)} className="border border-[#d7e4dc] font-black rounded-lg bg-white text-kharcha-navy hover:bg-gray-100 shadow-sm">{t('auditCancel' as any)}</Button>
              <Button type="submit" className="bg-black text-white font-black rounded-lg border border-[#d7e4dc] shadow-sm hover:bg-gray-800">{t('auditSaveExpense' as any)}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* BULK WHATSAPP MESSAGE MODAL */}
      <Dialog
        open={showBulkMessageModal}
        onOpenChange={(open) => {
          setShowBulkMessageModal(open);
          if (!open) {
            setBulkMessageQueue([]);
            setBulkMessageQueueIndex(0);
            setBulkMessageOpenedCount(0);
          }
        }}
      >
        <DialogContent className="bg-white border border-[#d7e4dc] rounded-2xl w-[calc(100%-1rem)] max-w-lg max-h-[90vh] min-w-0 overflow-x-hidden flex flex-col shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-black text-xl text-kharcha-navy">{t('auditSendBulkMessage' as any)}</DialogTitle>
            <DialogDescription className="text-kharcha-navy font-medium">{t('auditBulkMessageQueueHelp' as any)}</DialogDescription>
          </DialogHeader>

          {bulkMessageQueue.length === 0 ? (
            <>
              <div className="border border-[#d7e4dc] rounded-xl p-3 bg-gray-50 space-y-2">
                <p className="text-sm font-black text-kharcha-navy">Write Message</p>
                <textarea value={bulkMessageText} onChange={event => setBulkMessageText(event.target.value)} placeholder="Write the WhatsApp message…" rows={3} className="w-full resize-none rounded-xl border border-[#d7e4dc] bg-white p-3 text-sm font-medium text-kharcha-navy outline-none focus:ring-2 focus:ring-[#16834b]" />
              </div>

              <div className="flex min-w-0 flex-col gap-3 border border-[#d7e4dc] rounded-xl p-3 bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
                <p className="min-w-0 text-sm font-black text-kharcha-navy sm:flex-1">{t('auditSelectMembersForBulkMessage' as any)}</p>
                <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto sm:shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkMessageSelectedIds(getBulkMessageMembers().map(member => member.id))}
                    className="min-w-0 flex-1 border border-[#d7e4dc] bg-white px-2 text-center text-kharcha-navy font-black rounded-lg whitespace-normal break-words sm:flex-none"
                  >
                    {t('selectAll' as any)}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkMessageSelectedIds([])}
                    className="min-w-0 flex-1 border border-[#d7e4dc] bg-white px-2 text-center text-kharcha-navy font-black rounded-lg whitespace-normal break-words sm:flex-none"
                  >
                    {t('clearAll' as any)}
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
                {fund.members.length === 0 ? (
                  <p className="text-sm text-kharcha-navy font-bold py-4 text-center">{t('auditNoMembersAvailableShort' as any)}</p>
                ) : (
                  fund.members.map((member: GroupFundMember) => {
                    const hasPhone = Boolean(member.mobileNumber?.trim());
                    const checked = bulkMessageSelectedIds.includes(member.id);
                    return (
                      <label
                        key={member.id}
                        className={`flex items-center gap-3 border border-[#d7e4dc] rounded-xl p-3 ${hasPhone ? 'bg-white cursor-pointer' : 'bg-gray-100 opacity-60 cursor-not-allowed'}`}
                      >
                        <Checkbox
                          checked={checked}
                          disabled={!hasPhone}
                          onCheckedChange={(value) => {
                            setBulkMessageSelectedIds(current => toggleBulkMessageMember(current, member.id, Boolean(value)));
                          }}
                          className="border border-[#d7e4dc] data-[state=checked]:bg-[#16834b] data-[state=checked]:text-white"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-black text-kharcha-navy">{member.name}</span>
                          <span className="block truncate text-xs font-bold text-gray-600">{member.mobileNumber?.trim() || t('auditNoPhoneEmail' as any)}</span>
                        </span>
                        <span className="shrink-0 text-[10px] font-black uppercase tracking-wide text-gray-600">{bulkMessageStatuses[member.id] ?? 'Ready'}</span>
                      </label>
                    );
                  })
                )}
              </div>

              <DialogFooter className="shrink-0 pt-2 border-t flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  onClick={handleSendBulkToAll}
                  disabled={getBulkMessageMembers().length === 0}
                  className="w-full min-w-0 bg-[#16834b] text-white border border-[#d7e4dc] font-black rounded-xl shadow-sm disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
                >
                  <MessageSquare size={16} className="mr-1" /> {t('auditSendToAll' as any)}
                </Button>
                <Button
                  type="button"
                  onClick={handleSendBulkSelection}
                  disabled={bulkMessageSelectedIds.length === 0}
                  variant="outline"
                  className="w-full min-w-0 border border-[#d7e4dc] bg-white text-kharcha-navy font-black rounded-xl whitespace-normal break-words disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
                >
                  {t('auditSendSelection' as any, { count: bulkMessageSelectedIds.length })}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowBulkMessageModal(false)}
                  variant="outline"
                  className="w-full border border-[#d7e4dc] bg-white text-kharcha-navy font-black rounded-xl"
                >
                  {t('auditClose' as any)}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="border border-[#16834b] bg-green-50 rounded-xl p-4 text-center">
                <p className="text-xs font-black uppercase tracking-wide text-[#16834b]">{t('auditBulkMessageProgress' as any, { current: Math.min(bulkMessageQueueIndex + 1, bulkMessageQueue.length), total: bulkMessageQueue.length })}</p>
                {bulkMessageQueueIndex < bulkMessageQueue.length ? (
                  <p className="mt-2 text-lg font-black text-kharcha-navy">
                    {fund.members.find(member => member.id === bulkMessageQueue[bulkMessageQueueIndex])?.name}
                  </p>
                ) : (
                  <p className="mt-2 text-lg font-black text-[#16834b]">{t('auditBulkMessageComplete' as any)}</p>
                )}
                <p className="mt-1 text-sm font-bold text-kharcha-navy">{t('auditBulkMessageOpened' as any, { count: bulkMessageOpenedCount })}</p>
              </div>
              <DialogFooter className="shrink-0 pt-2 border-t flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  onClick={handleOpenNextBulkMessage}
                  disabled={bulkMessageQueueIndex >= bulkMessageQueue.length}
                  className="w-full min-w-0 bg-[#16834b] text-white border border-[#d7e4dc] font-black rounded-xl shadow-sm disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
                >
                  <MessageSquare size={16} className="mr-1" /> {t('auditOpenNextMessage' as any)}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowBulkMessageModal(false)}
                  variant="outline"
                  className="w-full min-w-0 border border-[#d7e4dc] bg-white text-kharcha-navy font-black rounded-xl sm:flex-1"
                >
                  {t('auditClose' as any)}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* BULK QR CODE MODE MODAL */}
      <Dialog open={showBulkQrModal} onOpenChange={setShowBulkQrModal}>
        <DialogContent className="bg-white border border-[#d7e4dc] rounded-2xl max-w-lg max-h-[90vh] flex flex-col shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-black text-xl text-kharcha-navy">{t('auditBulkCollection' as any, { period: selectedPeriod })}</DialogTitle>
            <DialogDescription className="text-kharcha-navy font-medium">{t('auditBulkCollectionDescription' as any)}</DialogDescription>
          </DialogHeader>

          {/* Sticky QR View at top */}
          <div className="shrink-0 p-3 bg-gray-50 border border-[#d7e4dc] rounded-xl my-2 flex items-center gap-4 shadow-sm">
            <div className="shrink-0">
              {fund.paymentConfig?.upiId ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(`upi://pay?pa=${fund.paymentConfig.upiId}&pn=${encodeURIComponent(fund.name)}`)}`}
                  alt={t('auditQrCode' as any)}
                  className="w-24 h-24 border border-[#d7e4dc] bg-white p-1 rounded-lg"
                />
              ) : (
                <div className="w-24 h-24 border border-[#d7e4dc] flex items-center justify-center text-xs text-center text-kharcha-navy font-bold bg-white p-1 rounded-lg">{t('auditNoUpiId' as any)}</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-wider text-kharcha-navy">{t('auditScanAnyUpi' as any)}</p>
              <p className="font-black text-kharcha-navy text-sm truncate">{fund.paymentConfig?.upiId || t('auditNoUpiConfigured' as any)}</p>
              <p className="text-xs text-[#16834b] font-black mt-1">{t('auditPeriodLabel' as any)}: {selectedPeriod}</p>
            </div>
          </div>

          {/* Scrollable Member List Below QR */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
            <h4 className="font-black text-kharcha-navy text-xs uppercase tracking-wide">{t('auditMembersList' as any)}</h4>
            {fund.members.length === 0 ? (
              <p className="text-xs text-kharcha-navy font-bold py-4 text-center">{t('auditNoMembersAvailableShort' as any)}</p>
            ) : (
              fund.members.map((m: GroupFundMember) => {
                const memberContributions = getMemberPeriodContributions(m.id);
                const paid = memberContributions.reduce((s: number, c: Contribution) => s + c.amount, 0);
                const expected = calculateExpectedAmountForPeriod(fund, m, selectedPeriod);
                const isCollected = memberContributions.length > 0;
                const currentVal = bulkAmounts[m.id] ?? '';

                return (
                  <div key={m.id} className="flex items-center justify-between gap-2 border border-[#d7e4dc] bg-white p-2.5 rounded-xl shadow-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-kharcha-navy text-sm truncate">{m.name}</p>
                      <p className="text-[11px] text-kharcha-navy font-bold">{t('auditExpectedOptional' as any, { amount: expected > 0 ? `₹${expected}` : t('auditOptionalLabel' as any) })}</p>
                    </div>

                    {isCollected ? (
                      <span className="text-xs font-black text-[#16834b] bg-green-50 px-3 py-1 rounded-lg border border-[#d7e4dc]">
                        ✓ Collected (₹{paid})
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          placeholder={t('auditAmountPlaceholder' as any)}
                          value={currentVal}
                          onChange={e => setBulkAmounts({ ...bulkAmounts, [m.id]: e.target.value })}
                          className="w-28 h-9 border border-[#d7e4dc] rounded-lg text-sm font-black text-kharcha-navy bg-white text-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleBulkMemberCollect(m)}
                          className="h-9 w-9 p-0 bg-[#16834b] text-white rounded-lg hover:bg-green-700 border border-[#d7e4dc] shadow-sm"
                          title={t('auditMarkCollectedTitle' as any)}
                        >
                          <Check size={16} />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="shrink-0 pt-2 border-t flex flex-wrap gap-2">
            <Button
              onClick={isSelectedPeriodClosed ? handleUndoCloseSelectedCollection : handleCloseSelectedCollection}
              disabled={!isSelectedPeriodClosed && !allCollectionMembersCollected}
              variant="outline"
              className={`flex-1 border border-[#d7e4dc] font-black rounded-xl ${isSelectedPeriodClosed ? 'bg-green-100 text-[#16834b]' : 'bg-white text-kharcha-navy'} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {t(isSelectedPeriodClosed ? 'auditUndoCloseCollection' : 'auditCloseCollection' as any)}
            </Button>
            <Button onClick={() => setShowBulkQrModal(false)} className="flex-1 bg-black text-white font-black rounded-xl py-3 border border-[#d7e4dc] shadow-sm hover:bg-gray-800">{t('auditCloseBulkMode' as any)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Add Member Dialog */}
      <Dialog open={showMemberModal} onOpenChange={(open) => { setShowMemberModal(open); if (!open) setEditingMember(undefined); }}>

        <DialogContent className="bg-white border border-[#d7e4dc] rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle className="font-black text-xl text-kharcha-navy">{editingMember ? t('edit') : t('auditAddMemberManually' as any)}</DialogTitle>
            <DialogDescription className="text-kharcha-navy font-bold">{editingMember ? editingMember.name : t('auditAddParticipant' as any)}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveMember} className="space-y-4">
            <div>
              <Label className="font-black text-kharcha-navy">{t('auditMemberNameRequired' as any)}</Label>
              <Input
                placeholder={t('auditMemberName' as any)}
                value={memberName}
                onChange={e => setMemberName(e.target.value)}
                className="border border-[#d7e4dc] rounded-lg mt-1 text-kharcha-navy font-bold bg-white shadow-sm"
                required
              />
            </div>
            <div>
              <Label className="font-black text-kharcha-navy">{t('auditExpectedContribution' as any)}</Label>
              <Input
                type="number"
                placeholder={fund.isRecurring && fund.amountType === 'Default Amount' ? String(fund.defaultContributionAmount ?? 0) : '500'}
                value={memberExpected}
                onChange={e => setMemberExpected(e.target.value)}
                className="border border-[#d7e4dc] rounded-lg mt-1 text-kharcha-navy font-bold bg-white shadow-sm"
              />
            </div>
            {fund.isRecurring && (
              <div>
                <Label className="font-black text-kharcha-navy">{t('auditMemberStartDate' as any)}</Label>
                <Input
                  type="date"
                  value={memberStartDate}
                  onChange={e => setMemberStartDate(e.target.value)}
                  className="border border-[#d7e4dc] rounded-lg mt-1 text-kharcha-navy font-bold bg-white shadow-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-600">{t('auditMemberStartDateHelp' as any)}</p>
              </div>
            )}
            {fund.isRecurring && (
              <div className="rounded-xl border border-[#d7e4dc] bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <Label className="font-black text-kharcha-navy">{t('auditStatusStopped' as any)}</Label>
                  <span className="text-xs font-bold text-gray-500">{t('auditStatusActive' as any)} {(!memberStopFrom || !memberStopUntil) ? '•' : ''}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-bold text-kharcha-navy">{t('pbPauseFrom' as any)}</Label>
                    <Input type="date" value={memberStopFrom} onChange={e => setMemberStopFrom(e.target.value)} className="mt-1 rounded-lg border border-[#d7e4dc] bg-white text-kharcha-navy" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-kharcha-navy">{t('pbPauseTo' as any)}</Label>
                    <Input type="date" value={memberStopUntil} onChange={e => setMemberStopUntil(e.target.value)} className="mt-1 rounded-lg border border-[#d7e4dc] bg-white text-kharcha-navy" />
                  </div>
                </div>
              </div>
            )}
            <div>
              <Label className="font-black text-kharcha-navy">{t('auditMobileWhatsApp' as any)}</Label>
              <Input
                type="tel"
                placeholder={t('auditMobilePlaceholder' as any)}
                value={memberMobile}
                onChange={e => setMemberMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="border border-[#d7e4dc] rounded-lg mt-1 text-kharcha-navy font-bold bg-white shadow-sm"
                maxLength={10}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => { setShowMemberModal(false); setEditingMember(undefined); }} className="border border-[#d7e4dc] font-black rounded-lg bg-white text-kharcha-navy hover:bg-gray-100 shadow-sm">{t('auditCancel' as any)}</Button>
              <Button type="submit" disabled={isSavingMember} className="bg-black text-white font-black rounded-lg border border-[#d7e4dc] shadow-sm hover:bg-gray-800 disabled:cursor-wait disabled:opacity-70">{isSavingMember && <Loader2 size={16} className="mr-1 animate-spin" />}{editingMember ? t('edit') : t('auditSaveMember' as any)}</Button>
              <Button type="submit" disabled={isSavingMember} className="bg-[#16834b] text-white font-black rounded-lg border border-[#d7e4dc] shadow-sm hover:bg-[#11663b] disabled:cursor-wait disabled:opacity-70">{t('auditDone' as any)}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="bg-white border border-[#d7e4dc] rounded-2xl max-w-sm text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle className="font-black text-xl text-kharcha-navy">{t('auditFundUpiQr' as any)}</DialogTitle>
            <DialogDescription className="text-kharcha-navy font-bold">{t('auditScanToContribute' as any, { name: fund.name })}</DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-gray-50 border border-[#d7e4dc] rounded-xl my-3 flex flex-col items-center justify-center shadow-sm">
            {fund.paymentConfig?.upiId ? (
              <>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${fund.paymentConfig.upiId}&pn=${encodeURIComponent(fund.name)}`)}`}
                  alt={t('auditUpiQrAlt' as any, { name: fund.name })}
                  className="w-48 h-48 border border-[#d7e4dc] bg-white p-2 rounded-lg"
                />
                <p className="mt-3 font-black text-kharcha-navy">{fund.paymentConfig.upiId}</p>
              </>
            ) : (
              <p className="text-sm text-kharcha-navy font-bold py-8">{t('auditNoFundUpi' as any)}</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowQrDialog(false)} className="w-full bg-black text-white font-black rounded-xl border border-[#d7e4dc] shadow-sm hover:bg-gray-800">{t('auditClose' as any)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EditSyncShareDialog open={showEditSync} onOpenChange={setShowEditSync} contextType="group_fund" contextId={fund.id} contextName={fund.name} snapshot={fund} />
    </div>
  );
}
