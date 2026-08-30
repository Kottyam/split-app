import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LanguageSelector from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import HelpGuideModal from '@/components/HelpGuideModal';
import { Settings, Shield, Database, Download, Upload, Share2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { generateBackupPayload, validateBackupJson, restoreBackupPayload, KharchaBackupPayload } from '@/lib/backupRestore';
import { isAppLockEnabled, getLockMethod, getAutoLockTimeout, setAppLockConfig, hasPinConfigured, isNativeDeviceAuthAvailable, setSessionUnlocked } from '@/lib/appLock';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AppSettingsDialogExtended({ open, onOpenChange }: Props) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'general' | 'backup' | 'security'>('general');
  const [showHelpGuide, setShowHelpGuide] = useState(false);

  // Backup state
  const [backupStatusMsg, setBackupStatusMsg] = useState<string>('');
  const [lastGeneratedPayload, setLastGeneratedPayload] = useState<{ filename: string; jsonStr: string } | null>(null);
  const [importPreview, setImportPreview] = useState<{ payload: KharchaBackupPayload; summary: any } | null>(null);
  const [importConflictModal, setImportConflictModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);



  // Security App Lock state
  const [lockEnabled, setLockEnabled] = useState(isAppLockEnabled());
  const [lockMethod, setLockMethod] = useState<'pin' | 'biometric'>(getLockMethod());
  const [autoLockTimeout, setAutoLockTimeout] = useState(getAutoLockTimeout());
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [deviceAuthAvailable, setDeviceAuthAvailable] = useState(isNativeDeviceAuthAvailable());

  useEffect(() => {
    if (!open) return;
    setLockEnabled(isAppLockEnabled());
    setLockMethod(getLockMethod());
    setAutoLockTimeout(getAutoLockTimeout());
    setDeviceAuthAvailable(isNativeDeviceAuthAvailable());
    setPinInput('');
    setConfirmPinInput('');
    setPinError('');
  }, [open]);

  const handleExportBackup = () => {
    try {
      const payload = generateBackupPayload();
      const jsonStr = JSON.stringify(payload, null, 2);
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `Kharcha_Backup_${dateStr}.json`;

      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = filename;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(url);

      localStorage.setItem('kharcha_last_backup_at', new Date().toISOString());
      setLastGeneratedPayload({ filename, jsonStr });
      setBackupStatusMsg(t('auditBackupExported' as any, { filename }));
    } catch (err) {
      console.error('Export error:', err);
      setBackupStatusMsg(t('auditBackupExportFailed' as any));
    }
  };

  const handleShareBackup = async () => {
    if (!lastGeneratedPayload) {
      handleExportBackup();
      return;
    }
    try {
      const blob = new Blob([lastGeneratedPayload.jsonStr], { type: 'application/json' });
      const file = new File([blob], lastGeneratedPayload.filename, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: t('auditBackupShareTitle' as any),
          text: t('auditBackupShareText' as any),
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: t('auditBackupShareTitle' as any),
          text: lastGeneratedPayload.jsonStr,
        });
      } else {
        alert(t('auditBackupShareUnsupported' as any));
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validateBackupJson(content);
      if (!res.valid || !res.payload || !res.summary) {
        alert(res.error || t('auditInvalidBackup' as any));
        return;
      }
      setImportPreview({ payload: res.payload, summary: res.summary });
      setImportConflictModal(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const executeRestore = () => {
    if (!importPreview) return;
    const summary = restoreBackupPayload(importPreview.payload);
    setImportConflictModal(false);
    setImportPreview(null);
    alert(`${t('auditRestoreSuccess' as any)}\n${t('myTrips')}: ${summary.tripsCount}\n${t('mySharedHomes')}: ${summary.sharedHomesCount}\n${t('groupFunds')}: ${summary.groupFundsCount}\n${t('transactions')}: ${summary.transactionsCount}\n${t('goals')}: ${summary.goalsCount}`);
  };



  const handleSaveSecurity = () => {
    if (lockEnabled && lockMethod === 'pin') {
      if (!hasPinConfigured() && (!pinInput || pinInput.length < 4)) {
        setPinError(t('auditPinRequired' as any));
        return;
      }
      if (pinInput && pinInput !== confirmPinInput) {
        setPinError(t('auditPinMismatch' as any));
        return;
      }
    }
    const deviceLockNotice = lockEnabled && lockMethod === 'biometric' && !deviceAuthAvailable;
    setPinError('');
    setSessionUnlocked(true);
    setAppLockConfig(lockEnabled, lockMethod, autoLockTimeout, lockMethod === 'pin' && pinInput ? pinInput : undefined);
    setSecuritySuccess(deviceLockNotice
      ? `${t('auditSecurityUpdated' as any)} ${t('deviceLockUnavailable')}`
      : t('auditSecurityUpdated' as any));
    setTimeout(() => setSecuritySuccess(''), 3000);
  };

  const lastBackupTime = localStorage.getItem('kharcha_last_backup_at');
  const lastBackupFormatted = lastBackupTime ? new Date(lastBackupTime).toLocaleString() : t('auditNever' as any);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl border-2 border-[#16834b] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black text-kharcha-navy">
            <Settings className="text-[#e87817]" size={20} />
            {t('settings')}
          </DialogTitle>
        </DialogHeader>

        {/* Sub-navigation tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
          <button type="button" onClick={() => setActiveTab('general')} className={`px-3 py-1.5 rounded-lg text-xs font-black shrink-0 ${activeTab === 'general' ? 'bg-[#16834b] text-white' : 'bg-gray-100 text-black'}`}>{t('generalTab')}</button>
          <button type="button" onClick={() => setActiveTab('backup')} className={`px-3 py-1.5 rounded-lg text-xs font-black shrink-0 ${activeTab === 'backup' ? 'bg-[#16834b] text-white' : 'bg-gray-100 text-black'}`}>{t('backupTab')}</button>
          <button type="button" onClick={() => setActiveTab('security')} className={`px-3 py-1.5 rounded-lg text-xs font-black shrink-0 ${activeTab === 'security' ? 'bg-[#16834b] text-white' : 'bg-gray-100 text-black'}`}>{t('securityTab')}</button>
          <button type="button" onClick={() => setShowHelpGuide(true)} className={`px-3 py-1.5 rounded-lg text-xs font-black shrink-0 bg-[#fff3e3] border border-[#e87817] text-[#e87817] flex items-center gap-1`}>{t('helpGuideTab')}</button>
        </div>

        <HelpGuideModal open={showHelpGuide} onOpenChange={setShowHelpGuide} />

        {activeTab === 'general' && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-[#fffaf3] p-3 border border-[#e7d7bd]">
              <p className="mb-2 text-sm font-bold text-kharcha-navy">{t('language')}</p>
              <LanguageSelector />
            </div>


          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-[#e4efff] p-4 border border-[#2563eb]/30">
              <h3 className="text-sm font-black text-kharcha-navy flex items-center gap-2">
                <Database size={16} className="text-[#2563eb]" /> {t('backupRestoreData')}
              </h3>
              <p className="mt-1 text-xs text-gray-700">{t('backupDesc')}</p>
              <div className="mt-3 text-xs font-bold text-gray-600">
                <p>{t('lastBackup')}: {lastBackupFormatted}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[#16834b]"><CheckCircle2 size={13} /> {t('localStorageActive')}</p>
              </div>
            </div>

            {backupStatusMsg && <div className="rounded-xl bg-[#dff1e5] p-3 text-xs font-black text-[#16834b]">{backupStatusMsg}</div>}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleExportBackup} className="flex-1 rounded-xl bg-[#16834b] font-black text-white">
                <Download size={15} className="mr-1.5" /> {t('exportBackupJson')}
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1 rounded-xl border-2 border-black font-black">
                <Upload size={15} className="mr-1.5" /> {t('importBackup')}
              </Button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelected} />
            </div>

            {lastGeneratedPayload && (
              <Button onClick={handleShareBackup} variant="outline" className="w-full rounded-xl border-2 border-black bg-[#fff3e3] font-black text-black">
                <Share2 size={15} className="mr-1.5 text-[#e87817]" /> {t('shareBackupApps')}
              </Button>
            )}

            {importConflictModal && importPreview && (
              <div className="rounded-xl border-2 border-black bg-[#fff3e3] p-4 space-y-3">
                <h4 className="font-black text-kharcha-navy flex items-center gap-2">
                  <AlertTriangle size={16} className="text-[#c45a00]" /> {t('restorePreview')}
                </h4>
                <div className="text-xs font-bold space-y-1 text-gray-700">
                  <p>{t('backupDate')}: {new Date(importPreview.summary.createdAt).toLocaleString()}</p>
                  <p>{t('myTrips')}: {importPreview.summary.tripsCount}</p>
                  <p>{t('mySharedHomes')}: {importPreview.summary.sharedHomesCount}</p>
                  <p>{t('groupFunds')}: {importPreview.summary.groupFundsCount}</p>
                  <p>{t('transactions')}: {importPreview.summary.transactionsCount}</p>
                  <p>{t('goals')}: {importPreview.summary.goalsCount}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => setImportConflictModal(false)} variant="outline" className="rounded-lg font-black">{t('cancel')}</Button>
                  <Button size="sm" onClick={executeRestore} className="rounded-lg bg-[#c45a00] font-black text-white">{t('continueRestore')}</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-[#fff3e3] p-4 border border-[#e87817]/30">
              <h3 className="text-sm font-black text-kharcha-navy flex items-center gap-2">
                <Shield size={16} className="text-[#e87817]" /> {t('appLockSecurity')}
              </h3>
              <p className="mt-1 text-xs text-gray-700">{t('appLockDesc')}</p>
            </div>

            {securitySuccess && <div className="rounded-xl bg-[#dff1e5] p-3 text-xs font-black text-[#16834b]">{securitySuccess}</div>}

            <div className="space-y-3">
              <label className="flex items-center justify-between font-bold text-sm">
                <span>{t('enableAppLock')}</span>
                <input type="checkbox" checked={lockEnabled} onChange={e => setLockEnabled(e.target.checked)} className="h-5 w-5 accent-[#16834b]" />
              </label>

              {lockEnabled && (
                <div className="space-y-3 rounded-xl border-2 border-black bg-gray-50 p-3">
                  <div>
                    <Label className="text-xs font-bold">{t('lockMethodLabel')}</Label>
                      <Select value={lockMethod} onValueChange={value => { setLockMethod(value as 'pin' | 'biometric'); setPinError(''); }}>
                      <SelectTrigger className="mt-1 border-2 border-black bg-white font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-2 border-black bg-white font-bold">
                        <SelectItem value="pin">{t('pinMethod')}</SelectItem>
                        <SelectItem value="biometric">{t('deviceLockMethod')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {lockMethod === 'pin' ? (
                    <>
                      <div>
                        <Label className="text-xs font-bold">{t('pinCodeLabel')}</Label>
                        <Input type="password" inputMode="numeric" maxLength={6} value={pinInput} onChange={e => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={t('enterPinPlaceholder')} className="mt-1 border-2 border-black" />
                      </div>
                      <div>
                        <Label className="text-xs font-bold">{t('confirmPinLabel')}</Label>
                        <Input type="password" inputMode="numeric" maxLength={6} value={confirmPinInput} onChange={e => setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={t('confirmPinPlaceholder')} className="mt-1 border-2 border-black" />
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg border border-[#e87817]/40 bg-[#fff3e3] p-3 text-xs font-bold leading-5 text-gray-700">
                      {t('deviceLockHint')}
                      {!deviceAuthAvailable && <p className="mt-2 font-black text-[#b95000]">{t('deviceLockUnavailable')}</p>}
                    </div>
                  )}
                  {pinError && <p className="text-xs font-black text-red-600">{pinError}</p>}

                  <div>
                    <Label className="text-xs font-bold">{t('autoLockTimeout')}</Label>
                    <Select value={autoLockTimeout} onValueChange={setAutoLockTimeout}>
                      <SelectTrigger className="mt-1 border-2 border-black bg-white font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-2 border-black font-bold">
                        <SelectItem value="immediate">{t('timeoutImmediate')}</SelectItem>
                        <SelectItem value="1min">{t('timeout1min')}</SelectItem>
                        <SelectItem value="5min">{t('timeout5min')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button onClick={handleSaveSecurity} className="w-full rounded-xl bg-[#16834b] font-black text-white">
                {t('auditSaveSecurity' as any)}
              </Button>
            </div>
          </div>
        )}

        <Button variant="outline" onClick={() => onOpenChange(false)} className="mt-2 rounded-xl font-bold">{t('close')}</Button>
      </DialogContent>
    </Dialog>
  );
}
