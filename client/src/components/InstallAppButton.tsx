import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export let deferredPrompt: InstallPromptEvent | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredPrompt = event as InstallPromptEvent; });
}

export function isInstalled(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia?.('(display-mode: standalone)').matches === true
    || new URLSearchParams(window.location.search).get('android') === '1'
    || /KharchaAndroid/i.test(navigator.userAgent);
}

export function getDeferredPrompt() { return deferredPrompt; }
export function clearDeferredPrompt() { deferredPrompt = null; }

/** "Install app" banner for the web (PWA). Hidden inside the installed/Android app. */
export default function InstallAppButton() {
  const { t } = useLanguage();
  const [canPrompt, setCanPrompt] = useState(!!deferredPrompt);
  const [showHelp, setShowHelp] = useState(false);
  const [hidden, setHidden] = useState(isInstalled());

  useEffect(() => {
    const onPrompt = () => setCanPrompt(true);
    const onInstalled = () => setHidden(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  if (hidden) return null;

  const install = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice.catch(() => ({ outcome: 'dismissed' }));
      deferredPrompt = null;
      setCanPrompt(false);
      if (choice.outcome === 'accepted') setHidden(true);
    } else setShowHelp(v => !v);
  };

  return (
    <div className="rounded-3xl bg-gradient-to-r from-[#023b81] to-[#0a5bc0] p-4 text-white shadow-lg">
      <div className="flex items-center gap-3">
        <img src="/icons/kharcha-logo-mark.png" alt="" className="h-11 w-11 rounded-2xl bg-white p-1" />
        <div className="min-w-0 flex-1">
          <p className="font-black leading-tight">{t('auditInstallKharcha' as any)}</p>
          <p className="text-xs text-white/80">{t('auditInstallKharchaHint' as any)}</p>
        </div>
        <Button variant="trip" onClick={install} className="min-h-11 shrink-0" data-can-prompt={canPrompt ? '1' : '0'}><Download size={16} className="mr-1.5" />{t('auditInstallApp' as any)}</Button>
      </div>
      {showHelp && <p className="mt-3 rounded-2xl bg-white/15 p-3 text-xs font-semibold">{t('auditInstallManualHelp' as any)}</p>}
    </div>
  );
}
