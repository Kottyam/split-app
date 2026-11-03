import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { clearDeferredPrompt, getDeferredPrompt, isInstalled } from '@/components/InstallAppButton';

export const INSTALL_DISMISS_KEY = 'kharchaInstallPromptDismissedAt';
export const INSTALL_DISMISS_DAYS = 7;

export function isInstallPromptSnoozed(now = Date.now()): boolean {
  try {
    const at = Number(localStorage.getItem(INSTALL_DISMISS_KEY) || 0);
    return at > 0 && now - at < INSTALL_DISMISS_DAYS * 864e5;
  } catch { return false; }
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function promptAllowedHere(): boolean {
  const host = window.location.hostname;
  return /(^|\.)kharchasplit\.in$/i.test(host) || import.meta.env.DEV || new URLSearchParams(window.location.search).get('pwa-prompt') === '1';
}

/** First-load popup asking web visitors to install the PWA. Hidden in the installed PWA / Android app. */
export default function InstallPromptDialog() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);

  useEffect(() => {
    if (isInstalled() || !promptAllowedHere() || isInstallPromptSnoozed()) return;
    setCanPrompt(!!getDeferredPrompt());
    const onPrompt = () => { setCanPrompt(true); setOpen(true); };
    const onInstalled = () => setOpen(false);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    // Show right away; browsers without beforeinstallprompt (iOS Safari, Firefox) get manual steps.
    const timer = window.setTimeout(() => setOpen(true), 900);
    return () => { window.clearTimeout(timer); window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  if (!open) return null;

  const dismiss = () => {
    try { localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now())); } catch { /* storage unavailable */ }
    setOpen(false);
  };
  const install = async () => {
    const evt = getDeferredPrompt();
    if (!evt) return;
    await evt.prompt();
    const choice = await evt.userChoice.catch(() => ({ outcome: 'dismissed' }));
    clearDeferredPrompt();
    if (choice.outcome === 'accepted') setOpen(false); else dismiss();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="install-prompt-title" data-testid="install-prompt">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <button type="button" onClick={dismiss} aria-label={t('auditInstallNotNow' as any)} className="absolute right-3 top-3 rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        <div className="flex items-center gap-3">
          <img src="/icons/kharcha-pwa-192.png" alt="" className="h-14 w-14 rounded-2xl shadow" />
          <div>
            <h2 id="install-prompt-title" className="text-lg font-black text-[#023b81]">{t('auditInstallPromptTitle' as any)}</h2>
            <p className="text-xs font-bold uppercase tracking-wide"><span className="text-[#0a5bc0]">Split Smart </span><span className="text-[#16a34a]">Live </span><span className="text-[#f97316]">Smart</span></p>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600">{t('auditInstallPromptBody' as any)}</p>
        {!canPrompt && (
          <p className="mt-3 flex gap-2 rounded-2xl bg-blue-50 p-3 text-sm font-semibold text-[#023b81]">
            <Share size={18} className="mt-0.5 shrink-0" />{t((isIos() ? 'auditInstallIosSteps' : 'auditInstallOtherSteps') as any)}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="min-h-11 flex-1 rounded-xl" onClick={dismiss}>{t('auditInstallNotNow' as any)}</Button>
          {canPrompt
            ? <Button className="min-h-11 flex-1 rounded-xl bg-[#023b81] text-white" onClick={install}><Download size={16} className="mr-1.5" />{t('auditInstallApp' as any)}</Button>
            : <Button className="min-h-11 flex-1 rounded-xl bg-[#023b81] text-white" onClick={dismiss}>{t('auditInstallGotIt' as any)}</Button>}
        </div>
      </div>
    </div>
  );
}
