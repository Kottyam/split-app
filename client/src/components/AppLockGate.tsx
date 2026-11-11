import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Fingerprint, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  APP_LOCK_CONFIG_EVENT,
  DEVICE_AUTH_RESULT_EVENT,
  MAX_PIN_LENGTH,
  attemptPinUnlock,
  checkAutoLockOnResume,
  consumeNativeDeviceAuthResult,
  getLockMethod,
  getPinCooldownRemainingMs,
  hasPinConfigured,
  isNativeDeviceAuthAvailable,
  markAppBackgrounded,
  requestNativeDeviceAuth,
  resetPinAttempts,
  setSessionUnlocked,
  shouldShowLockScreen,
} from '@/lib/appLock';
import BrandLogo from './BrandLogo';

interface Props {
  children: ReactNode;
}

const APP_RESUME_EVENT = 'kharcha-app-resume';

/**
 * Locks the whole app (every route, including shared links that can read or change local data)
 * behind the Kharcha PIN and, inside the Android app, the phone's fingerprint / screen lock.
 *
 * - Cold start: the app content is not mounted at all until the first unlock.
 * - Relock after background: content stays mounted underneath (so half-filled forms survive), and
 *   the lock screen is a top-most modal layer that also covers any dialog that was open.
 * - A PIN is always the fallback, so a missing fingerprint sensor or a cancelled prompt can never
 *   lock the owner out.
 */
export default function AppLockGate({ children }: Props) {
  const { t } = useLanguage();
  const [locked, setLocked] = useState(() => shouldShowLockScreen());
  const [contentMounted, setContentMounted] = useState(() => !shouldShowLockScreen());
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [authPending, setAuthPending] = useState(false);
  const [deviceAvailable, setDeviceAvailable] = useState(() => isNativeDeviceAuthAvailable());
  const [cooldownMs, setCooldownMs] = useState(() => getPinCooldownRemainingMs());
  const [showForgot, setShowForgot] = useState(false);
  const authPendingRef = useRef(false);
  const deviceAuthInFlightRef = useRef(false);
  const autoPromptedRef = useRef(false);
  const forgotFlowRef = useRef(false);
  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  const setAuthPendingValue = (value: boolean) => {
    authPendingRef.current = value;
    setAuthPending(value);
  };

  const engageLock = useCallback(() => {
    setLocked(true);
    setPin('');
    setError('');
    setShowForgot(false);
    autoPromptedRef.current = false;
    forgotFlowRef.current = false;
    setDeviceAvailable(isNativeDeviceAuthAvailable());
    setCooldownMs(getPinCooldownRemainingMs());
  }, []);

  const unlock = useCallback((message = '') => {
    setSessionUnlocked(true);
    setLocked(false);
    setContentMounted(true);
    setPin('');
    setError('');
    setShowForgot(false);
    setNotice(message);
    deviceAuthInFlightRef.current = false;
    setAuthPendingValue(false);
  }, []);

  const startDeviceAuth = useCallback(() => {
    if (deviceAuthInFlightRef.current) return;
    if (!isNativeDeviceAuthAvailable()) {
      setDeviceAvailable(false);
      setError(t('deviceAuthUnavailable'));
      return;
    }
    setError('');
    deviceAuthInFlightRef.current = true;
    setAuthPendingValue(true);
    if (!requestNativeDeviceAuth(t('unlockTitle'), t('deviceLockHint'))) {
      deviceAuthInFlightRef.current = false;
      setAuthPendingValue(false);
      setError(t('deviceAuthFailed'));
    }
  }, [t]);

  useEffect(() => {
    const refreshLockState = () => {
      deviceAuthInFlightRef.current = false;
      setAuthPendingValue(false);
      setDeviceAvailable(isNativeDeviceAuthAvailable());
      if (!shouldShowLockScreen()) {
        setLocked(false);
        setContentMounted(true);
        setError('');
        return;
      }
      engageLock();
    };
    const applyDeviceAuthResult = (result: string) => {
      deviceAuthInFlightRef.current = false;
      setAuthPendingValue(false);
      if (!lockedRef.current) return;
      if (result === 'success') {
        resetPinAttempts();
        const fromForgotFlow = forgotFlowRef.current;
        forgotFlowRef.current = false;
        unlock(fromForgotFlow ? t('lockSetNewPinReminder' as any) : '');
      } else if (result === 'unavailable') {
        setDeviceAvailable(false);
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
    const onHidden = () => {
      // The Android credential screen hides the WebView too; that round-trip is not "leaving the app".
      if (deviceAuthInFlightRef.current || lockedRef.current) return;
      markAppBackgrounded();
    };
    const onResume = () => {
      // The Android credential screen causes a visibility round-trip. Do not
      // relock or start a second prompt before its result event is delivered.
      if (deviceAuthInFlightRef.current) return;
      if (lockedRef.current) {
        setCooldownMs(getPinCooldownRemainingMs());
        setDeviceAvailable(isNativeDeviceAuthAvailable());
        return;
      }
      if (checkAutoLockOnResume()) engageLock();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') onHidden();
      else if (document.visibilityState === 'visible') onResume();
    };

    window.addEventListener(APP_LOCK_CONFIG_EVENT, refreshLockState);
    window.addEventListener(DEVICE_AUTH_RESULT_EVENT, onDeviceAuthResult);
    window.addEventListener(APP_RESUME_EVENT, onResume);
    window.addEventListener('pagehide', onHidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    const pendingResultTimer = window.setTimeout(() => {
      const pendingResult = consumeNativeDeviceAuthResult();
      if (pendingResult) applyDeviceAuthResult(pendingResult);
    }, 0);
    return () => {
      window.clearTimeout(pendingResultTimer);
      window.removeEventListener(APP_LOCK_CONFIG_EVENT, refreshLockState);
      window.removeEventListener(DEVICE_AUTH_RESULT_EVENT, onDeviceAuthResult);
      window.removeEventListener(APP_RESUME_EVENT, onResume);
      window.removeEventListener('pagehide', onHidden);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [engageLock, t, unlock]);

  // Fingerprint / phone-lock mode: open the system prompt once per lock, as soon as the screen shows.
  useEffect(() => {
    if (!locked || getLockMethod() !== 'biometric' || autoPromptedRef.current) return;
    if (document.visibilityState === 'hidden') return;
    autoPromptedRef.current = true;
    if (!isNativeDeviceAuthAvailable()) {
      setDeviceAvailable(false);
      return;
    }
    startDeviceAuth();
  }, [locked, startDeviceAuth]);

  // Never leave a lock screen that cannot be passed (no PIN and the phone lock just went away).
  useEffect(() => {
    if (locked && !shouldShowLockScreen()) unlock();
  }, [deviceAvailable, locked, unlock]);

  // Tick the wrong-PIN cool-down.
  useEffect(() => {
    if (!locked || cooldownMs <= 0) return;
    const timer = window.setTimeout(() => setCooldownMs(getPinCooldownRemainingMs()), Math.min(cooldownMs, 1000));
    return () => window.clearTimeout(timer);
  }, [cooldownMs, locked]);

  // Clear the post-unlock reminder after a while.
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handlePinUnlock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pin) return;
    const result = attemptPinUnlock(pin);
    if (result.ok) {
      unlock();
      return;
    }
    setPin('');
    if (result.reason === 'cooldown') {
      setCooldownMs(result.cooldownMs);
      return;
    }
    setCooldownMs(result.cooldownMs);
    setError(result.attemptsLeft > 0
      ? t('unlockAttemptsLeft' as any, { count: result.attemptsLeft })
      : t('unlockIncorrectPin'));
  };

  const verifyForForgotPin = () => {
    forgotFlowRef.current = true;
    startDeviceAuth();
  };

  const pinConfigured = hasPinConfigured();
  const deviceMode = getLockMethod() === 'biometric';
  const showDeviceButton = deviceAvailable && (deviceMode || !pinConfigured);
  const cooldownSeconds = Math.ceil(cooldownMs / 1000);

  return (
    <>
      {contentMounted && children}
      {!locked && notice && (
        <div role="status" className="kharcha-lock-notice fixed inset-x-3 top-3 z-[90] mx-auto max-w-sm rounded-xl border border-[#16834b] bg-[#e6f3e8] px-4 py-3 text-center text-sm font-bold text-[#11663b] shadow-lg">
          {notice}
        </div>
      )}
      <DialogPrimitive.Root open={locked} modal>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="kharcha-lock-screen fixed inset-0 z-[200] bg-white" />
          <DialogPrimitive.Content
            data-kharcha-lock-screen="true"
            onEscapeKeyDown={event => event.preventDefault()}
            onPointerDownOutside={event => event.preventDefault()}
            onInteractOutside={event => event.preventDefault()}
            onOpenAutoFocus={event => {
              // Let the PIN input's autoFocus decide; don't steal focus to the first button.
              if (deviceMode) event.preventDefault();
            }}
            className="kharcha-lock-screen fixed inset-0 z-[201] flex min-h-screen items-center justify-center overflow-y-auto bg-white px-5 py-8 outline-none"
          >
            <div className="w-full max-w-sm rounded-[2rem] border-2 border-[#16834b] bg-white p-6 text-center shadow-2xl">
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#e4f2e7] text-[#16834b]">
                {deviceMode ? <Fingerprint size={34} strokeWidth={2.4} /> : <ShieldCheck size={34} strokeWidth={2.4} />}
              </div>
              <BrandLogo className="mx-auto mb-5 w-44" />
              <DialogPrimitive.Title asChild>
                <h1 className="text-2xl font-black text-kharcha-navy">{t('unlockTitle')}</h1>
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-gray-600">
                {deviceMode && deviceAvailable ? t('lockFingerprintUnlockHint' as any) : t('unlockDescription')}
              </DialogPrimitive.Description>

              {showDeviceButton && (
                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={startDeviceAuth}
                    disabled={authPending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#16834b] px-4 py-3 font-black text-white hover:bg-[#126b3c] disabled:opacity-70"
                  >
                    {authPending ? <Loader2 className="animate-spin" size={18} /> : <Fingerprint size={18} />}
                    {t('unlockWithFingerprint' as any)}
                  </button>
                  {pinConfigured && <p className="text-xs font-bold text-gray-500">{t('unlockOrUsePin' as any)}</p>}
                </div>
              )}

              {error && <p className="mt-4 text-sm font-black text-red-600" role="alert">{error}</p>}

              {pinConfigured && !showForgot && (
                <form onSubmit={handlePinUnlock} className="mt-4 space-y-3">
                  <label htmlFor="kharcha-unlock-pin" className="sr-only">{t('pinCodeLabel')}</label>
                  <input
                    id="kharcha-unlock-pin"
                    type="password"
                    inputMode="numeric"
                    autoComplete="current-password"
                    maxLength={MAX_PIN_LENGTH}
                    value={pin}
                    disabled={cooldownMs > 0}
                    onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, MAX_PIN_LENGTH))}
                    placeholder={t('enterPinPlaceholder')}
                    className="w-full rounded-xl border-2 border-[#16834b] bg-white px-4 py-3 text-center text-lg font-black tracking-[0.35em] text-kharcha-navy outline-none focus:ring-2 focus:ring-[#e87817] disabled:opacity-60"
                    autoFocus={!deviceMode}
                  />
                  {cooldownMs > 0 && (
                    <p className="text-sm font-black text-[#b95000]" role="status" aria-live="polite">
                      {t('unlockTooManyAttempts' as any, { seconds: cooldownSeconds })}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={cooldownMs > 0 || pin.length === 0}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-black disabled:opacity-60 ${showDeviceButton ? 'border-2 border-[#16834b] bg-white text-[#16834b]' : 'bg-[#16834b] text-white hover:bg-[#126b3c]'}`}
                  >
                    <ShieldCheck size={17} />
                    {t('unlockPinButton')}
                  </button>
                  <button type="button" onClick={() => { setShowForgot(true); setError(''); }} className="text-sm font-bold text-[#023b81] underline underline-offset-2">
                    {t('forgotPin' as any)}
                  </button>
                </form>
              )}

              {pinConfigured && showForgot && (
                <div className="mt-5 space-y-3 rounded-xl border border-[#e87817]/40 bg-[#fff3e3] p-4 text-left text-sm leading-6 text-gray-700">
                  {deviceAvailable ? (
                    <>
                      <p className="font-bold">{t('forgotPinDeviceHint' as any)}</p>
                      <button type="button" onClick={verifyForForgotPin} disabled={authPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#16834b] px-4 py-3 font-black text-white disabled:opacity-70">
                        {authPending ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
                        {t('forgotPinVerifyDevice' as any)}
                      </button>
                    </>
                  ) : (
                    <p className="font-bold">{t('forgotPinResetHint' as any)}</p>
                  )}
                  <button type="button" onClick={() => { setShowForgot(false); setError(''); }} className="w-full rounded-xl border-2 border-[#16834b] bg-white px-4 py-2.5 font-black text-[#16834b]">
                    {t('lockBackToPin' as any)}
                  </button>
                </div>
              )}

              {!pinConfigured && !deviceAvailable && (
                <p className="mt-4 text-sm font-bold text-gray-600">{t('deviceAuthUnavailable')}</p>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
