import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { Fingerprint, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  APP_LOCK_CONFIG_EVENT,
  DEVICE_AUTH_RESULT_EVENT,
  consumeNativeDeviceAuthResult,
  checkAutoLockOnActivity,
  getLockMethod,
  isAppLockEnabled,
  isNativeDeviceAuthAvailable,
  isSessionUnlocked,
  requestNativeDeviceAuth,
  setSessionUnlocked,
  verifyPin,
} from '@/lib/appLock';
import BrandLogo from './BrandLogo';

interface Props {
  children: ReactNode;
}

export default function AppLockGate({ children }: Props) {
  const { t } = useLanguage();
  const [locked, setLocked] = useState(() => isAppLockEnabled() && !isSessionUnlocked());
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [authPending, setAuthPending] = useState(false);
  const authPendingRef = useRef(false);
  const deviceAuthInFlightRef = useRef(false);
  const setAuthPendingValue = (value: boolean) => {
    authPendingRef.current = value;
    setAuthPending(value);
  };

  const refreshLockState = () => {
    if (!isAppLockEnabled()) {
      setSessionUnlocked(false);
      setLocked(false);
      deviceAuthInFlightRef.current = false;
      setAuthPendingValue(false);
      setError('');
      return;
    }
    setLocked(!isSessionUnlocked());
    setPin('');
    setError('');
    deviceAuthInFlightRef.current = false;
    setAuthPendingValue(false);
  };

  useEffect(() => {
    const onConfigChanged = () => refreshLockState();
    const applyDeviceAuthResult = (result: string) => {
      deviceAuthInFlightRef.current = false;
      setAuthPendingValue(false);
      if (result === 'success') {
        setSessionUnlocked(true);
        setLocked(false);
        setError('');
      } else if (result === 'unavailable') {
        setError(t('deviceAuthUnavailable'));
      } else if (result === 'canceled') {
        setError(t('deviceAuthCanceled'));
      } else {
        setError(t('deviceAuthFailed'));
      }
    };
    const onDeviceAuthResult = (event: Event) => {
      consumeNativeDeviceAuthResult();
      applyDeviceAuthResult((event as CustomEvent<string>).detail);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !isAppLockEnabled()) return;
      // The Android credential screen causes a visibility round-trip. Do not
      // relock or start a second prompt before its result event is delivered.
      if (deviceAuthInFlightRef.current) return;
      const autoLocked = checkAutoLockOnActivity();
      if (autoLocked || !isSessionUnlocked()) {
        setLocked(true);
        setPin('');
        setAuthPendingValue(false);
      }
    };

    window.addEventListener(APP_LOCK_CONFIG_EVENT, onConfigChanged);
    window.addEventListener(DEVICE_AUTH_RESULT_EVENT, onDeviceAuthResult);
    document.addEventListener('visibilitychange', onVisibilityChange);
    const pendingResultTimer = window.setTimeout(() => {
      const pendingResult = consumeNativeDeviceAuthResult();
      if (pendingResult) applyDeviceAuthResult(pendingResult);
    }, 0);
    return () => {
      window.clearTimeout(pendingResultTimer);
      window.removeEventListener(APP_LOCK_CONFIG_EVENT, onConfigChanged);
      window.removeEventListener(DEVICE_AUTH_RESULT_EVENT, onDeviceAuthResult);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [t]);

  useEffect(() => {
    if (!locked || getLockMethod() !== 'biometric' || authPendingRef.current || error) return;
    if (!isNativeDeviceAuthAvailable()) {
      setError(t('deviceAuthUnavailable'));
      return;
    }
    deviceAuthInFlightRef.current = true;
    setAuthPendingValue(true);
    if (!requestNativeDeviceAuth(t('unlockTitle'), t('deviceLockHint'))) {
      deviceAuthInFlightRef.current = false;
      setAuthPendingValue(false);
      setError(t('deviceAuthFailed'));
    }
  }, [authPending, error, locked, t]);

  const handlePinUnlock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (verifyPin(pin)) {
      setSessionUnlocked(true);
      setLocked(false);
      setPin('');
      setError('');
      return;
    }
    setError(t('unlockIncorrectPin'));
    setPin('');
  };

  const retryDeviceAuth = () => {
    setError('');
    deviceAuthInFlightRef.current = false;
    setAuthPendingValue(false);
  };

  if (!locked) return <>{children}</>;

  const usingDeviceLock = getLockMethod() === 'biometric';

  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto bg-kharcha-cream px-5 py-8">
      <div className="w-full max-w-sm rounded-[2rem] border-2 border-[#16834b] bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#e4f2e7] text-[#16834b]">
          {usingDeviceLock ? <Fingerprint size={34} strokeWidth={2.4} /> : <ShieldCheck size={34} strokeWidth={2.4} />}
        </div>
        <BrandLogo className="mx-auto mb-5 w-44" />
        <h1 className="text-2xl font-black text-kharcha-navy">{t('unlockTitle')}</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          {usingDeviceLock ? t('deviceLockHint') : t('unlockDescription')}
        </p>

        {usingDeviceLock ? (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-[#fff3e3] px-3 py-3 text-sm font-bold text-kharcha-navy">
              <KeyRound size={17} className="text-[#e87817]" />
              {t('deviceLockMethod')}
            </div>
            {authPending && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm font-bold text-[#16834b]" role="status" aria-live="polite">
                <Loader2 className="animate-spin" size={18} />
                {t('unlockUseDevice')}…
              </div>
            )}
            {error && <p className="text-sm font-black text-red-600" role="alert">{error}</p>}
            {error && (
              <button type="button" onClick={retryDeviceAuth} className="w-full rounded-xl bg-[#16834b] px-4 py-3 font-black text-white hover:bg-[#126b3c]">
                {t('unlockUseDevice')}
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handlePinUnlock} className="mt-6 space-y-3">
            <label htmlFor="kharcha-unlock-pin" className="sr-only">{t('pinCodeLabel')}</label>
            <input
              id="kharcha-unlock-pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={6}
              value={pin}
              onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('enterPinPlaceholder')}
              className="w-full rounded-xl border-2 border-[#16834b] bg-white px-4 py-3 text-center text-lg font-black tracking-[0.35em] text-kharcha-navy outline-none focus:ring-2 focus:ring-[#e87817]"
              autoFocus
            />
            {error && <p className="text-sm font-black text-red-600" role="alert">{error}</p>}
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#16834b] px-4 py-3 font-black text-white hover:bg-[#126b3c]">
              <ShieldCheck size={17} />
              {t('unlockPinButton')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
