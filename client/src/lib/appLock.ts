// Local app-lock preferences. The Android device-lock option delegates authentication to
// the phone's system credential screen through the KharchaSecurity JavaScript bridge.
const PIN_KEY = 'kharcha_lock_pin_hash';
const LOCK_ENABLED_KEY = 'kharcha_lock_enabled';
const LOCK_METHOD_KEY = 'kharcha_lock_method'; // 'pin' | 'biometric'
const AUTO_LOCK_TIMEOUT_KEY = 'kharcha_auto_lock_timeout'; // 'immediate' | '1min' | '5min'
const LAST_ACTIVE_KEY = 'kharcha_last_active_timestamp';
const LOCK_SESSION_UNLOCKED_KEY = 'kharcha_session_unlocked';
const BACKGROUNDED_AT_KEY = 'kharcha_lock_backgrounded_at';
const FAILED_ATTEMPTS_KEY = 'kharcha_lock_failed_attempts';
const COOLDOWN_UNTIL_KEY = 'kharcha_lock_cooldown_until';

/** Wrong PIN entries allowed before a short cool-down kicks in. */
export const MAX_PIN_ATTEMPTS = 5;
/** Cool-down after {@link MAX_PIN_ATTEMPTS} wrong PINs. Short on purpose: it slows guessing without locking the owner out. */
export const PIN_COOLDOWN_MS = 30_000;
export const MIN_PIN_LENGTH = 4;
export const MAX_PIN_LENGTH = 6;

export type AppLockMethod = 'pin' | 'biometric';
export const APP_LOCK_CONFIG_EVENT = 'kharcha-app-lock-config-changed';
export const DEVICE_AUTH_RESULT_EVENT = 'kharcha-device-auth-result';
const NATIVE_DEVICE_AUTH_RESULT_KEY = 'kharcha_native_device_auth_result';
export type DeviceAuthResult = 'success' | 'canceled' | 'unavailable' | 'failed';

type NativeSecurityBridge = {
  isDeviceAuthAvailable?: () => boolean;
  requestDeviceAuth?: (title?: string, message?: string) => void;
  consumeDeviceAuthResult?: () => string | null;
};

function getNativeSecurityBridge(): NativeSecurityBridge | null {
  if (typeof window === 'undefined') return null;
  const bridge = (window as Window & { KharchaSecurity?: NativeSecurityBridge }).KharchaSecurity;
  return bridge && typeof bridge === 'object' ? bridge : null;
}

export function isAppLockEnabled(): boolean {
  return localStorage.getItem(LOCK_ENABLED_KEY) === 'true';
}

export function getLockMethod(): AppLockMethod {
  return localStorage.getItem(LOCK_METHOD_KEY) === 'biometric' ? 'biometric' : 'pin';
}

export function getAutoLockTimeout(): string {
  return localStorage.getItem(AUTO_LOCK_TIMEOUT_KEY) || 'immediate';
}

export function setAppLockConfig(enabled: boolean, method: AppLockMethod, timeout: string, pin?: string): void {
  localStorage.setItem(LOCK_ENABLED_KEY, String(enabled));
  localStorage.setItem(LOCK_METHOD_KEY, method);
  localStorage.setItem(AUTO_LOCK_TIMEOUT_KEY, timeout);
  if (pin) {
    // Keep the existing storage format so users who already configured a PIN are not locked out.
    // The Android device-lock method uses the OS credential prompt instead of this value.
    const hashed = btoa(pin + '_kharcha_salt_2026');
    localStorage.setItem(PIN_KEY, hashed);
  }
  if (!enabled) {
    sessionStorage.removeItem(LOCK_SESSION_UNLOCKED_KEY);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(APP_LOCK_CONFIG_EVENT));
  }
}

export function verifyPin(pin: string): boolean {
  const stored = localStorage.getItem(PIN_KEY);
  if (!stored) return false;
  const hashed = btoa(pin + '_kharcha_salt_2026');
  return stored === hashed;
}

export function hasPinConfigured(): boolean {
  return !!localStorage.getItem(PIN_KEY);
}

export function isSessionUnlocked(): boolean {
  if (!isAppLockEnabled()) return true;
  return sessionStorage.getItem(LOCK_SESSION_UNLOCKED_KEY) === 'true';
}

export function setSessionUnlocked(unlocked: boolean): void {
  if (unlocked) {
    sessionStorage.setItem(LOCK_SESSION_UNLOCKED_KEY, 'true');
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
    sessionStorage.removeItem(BACKGROUNDED_AT_KEY);
  } else {
    sessionStorage.removeItem(LOCK_SESSION_UNLOCKED_KEY);
  }
}

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${MIN_PIN_LENGTH},${MAX_PIN_LENGTH}}$`).test(pin);
}

/** Forget the stored PIN (used when the lock is turned off, so a stale PIN can never lock the owner out later). */
export function clearPin(): void {
  localStorage.removeItem(PIN_KEY);
  resetPinAttempts();
}

/**
 * True when the lock is on AND there is a way to unlock it on this device: a Kharcha PIN, or the
 * Android fingerprint / phone-lock bridge. If neither exists (for example an old config that chose
 * phone lock without a PIN and the phone lock was later removed) the app stays open instead of
 * showing a lock screen nobody can pass.
 */
export function canEnforceAppLock(): boolean {
  if (!isAppLockEnabled()) return false;
  if (hasPinConfigured()) return true;
  return getLockMethod() === 'biometric' && isNativeDeviceAuthAvailable();
}

/** Should the lock screen be shown right now (cold start or a relock)? */
export function shouldShowLockScreen(): boolean {
  return canEnforceAppLock() && !isSessionUnlocked();
}

function timeoutThresholdMs(timeoutSetting: string): number {
  if (timeoutSetting === '1min') return 60 * 1000;
  if (timeoutSetting === '5min') return 5 * 60 * 1000;
  return 0; // immediate: lock as soon as the app comes back from the background
}

/** Remember when an unlocked app went to the background (tab hidden / Android app minimised). */
export function markAppBackgrounded(now: number = Date.now()): void {
  if (!isAppLockEnabled() || !isSessionUnlocked()) return;
  sessionStorage.setItem(BACKGROUNDED_AT_KEY, String(now));
  localStorage.setItem(LAST_ACTIVE_KEY, String(now));
}

/**
 * Called when the app becomes visible again. Locks the session when it was in the background for
 * longer than the chosen auto-lock time. Resume events without a matching background event (for
 * example the Android fingerprint sheet closing) never relock.
 */
export function checkAutoLockOnResume(now: number = Date.now()): boolean {
  if (!canEnforceAppLock()) {
    sessionStorage.removeItem(BACKGROUNDED_AT_KEY);
    return false;
  }
  if (!isSessionUnlocked()) return true;
  const raw = sessionStorage.getItem(BACKGROUNDED_AT_KEY);
  if (!raw) return false;
  sessionStorage.removeItem(BACKGROUNDED_AT_KEY);
  const backgroundedAt = Number(raw);
  if (!Number.isFinite(backgroundedAt)) return false;
  if (now - backgroundedAt > timeoutThresholdMs(getAutoLockTimeout())) {
    setSessionUnlocked(false);
    return true;
  }
  localStorage.setItem(LAST_ACTIVE_KEY, String(now));
  return false;
}

export function resetPinAttempts(): void {
  localStorage.removeItem(FAILED_ATTEMPTS_KEY);
  localStorage.removeItem(COOLDOWN_UNTIL_KEY);
}

/** Milliseconds left in the wrong-PIN cool-down (0 when PIN entry is allowed). */
export function getPinCooldownRemainingMs(now: number = Date.now()): number {
  const until = Number(localStorage.getItem(COOLDOWN_UNTIL_KEY) || 0);
  if (!Number.isFinite(until) || until <= now) return 0;
  // Guard against a clock change leaving an absurd cool-down behind.
  return Math.min(until - now, PIN_COOLDOWN_MS);
}

export type PinUnlockResult =
  | { ok: true }
  | { ok: false; reason: 'cooldown'; cooldownMs: number }
  | { ok: false; reason: 'incorrect'; attemptsLeft: number; cooldownMs: number };

/** Check a PIN typed on the lock screen, with a short cool-down after repeated wrong entries. */
export function attemptPinUnlock(pin: string, now: number = Date.now()): PinUnlockResult {
  const cooldownMs = getPinCooldownRemainingMs(now);
  if (cooldownMs > 0) return { ok: false, reason: 'cooldown', cooldownMs };
  if (verifyPin(pin)) {
    resetPinAttempts();
    setSessionUnlocked(true);
    return { ok: true };
  }
  const failures = Number(localStorage.getItem(FAILED_ATTEMPTS_KEY) || 0) + 1;
  if (failures >= MAX_PIN_ATTEMPTS) {
    localStorage.setItem(FAILED_ATTEMPTS_KEY, '0');
    localStorage.setItem(COOLDOWN_UNTIL_KEY, String(now + PIN_COOLDOWN_MS));
    return { ok: false, reason: 'incorrect', attemptsLeft: 0, cooldownMs: PIN_COOLDOWN_MS };
  }
  localStorage.setItem(FAILED_ATTEMPTS_KEY, String(failures));
  return { ok: false, reason: 'incorrect', attemptsLeft: MAX_PIN_ATTEMPTS - failures, cooldownMs: 0 };
}

export function checkAutoLockOnActivity(): boolean {
  if (!isAppLockEnabled()) return false;
  const timeoutSetting = getAutoLockTimeout();
  const lastActive = Number(localStorage.getItem(LAST_ACTIVE_KEY) || Date.now());
  const now = Date.now();
  const diffMs = now - lastActive;

  let thresholdMs = 0;
  if (timeoutSetting === '1min') thresholdMs = 60 * 1000;
  else if (timeoutSetting === '5min') thresholdMs = 5 * 60 * 1000;
  else thresholdMs = 0; // immediate: lock as soon as the app becomes visible again

  if (diffMs > thresholdMs) {
    setSessionUnlocked(false);
    return true;
  }
  localStorage.setItem(LAST_ACTIVE_KEY, String(now));
  return false;
}

export function isNativeDeviceAuthAvailable(): boolean {
  const bridge = getNativeSecurityBridge();
  if (!bridge || typeof bridge.isDeviceAuthAvailable !== 'function') return false;
  try {
    return bridge.isDeviceAuthAvailable() === true;
  } catch {
    return false;
  }
}

export function consumeNativeDeviceAuthResult(): DeviceAuthResult | null {
  const bridge = getNativeSecurityBridge();
  const consumeNativePending = () => {
    if (!bridge || typeof bridge.consumeDeviceAuthResult !== 'function') return null;
    try {
      return bridge.consumeDeviceAuthResult();
    } catch {
      return null;
    }
  };
  try {
    const result = localStorage.getItem(NATIVE_DEVICE_AUTH_RESULT_KEY) as DeviceAuthResult | null;
    if (result) {
      localStorage.removeItem(NATIVE_DEVICE_AUTH_RESULT_KEY);
      // Clear the native copy too, otherwise a later mount could replay it.
      consumeNativePending();
      return ['success', 'canceled', 'unavailable', 'failed'].includes(result) ? result : null;
    }
  } catch {
    // Fall through to the native channel when WebView storage is unavailable.
  }
  const nativeResult = consumeNativePending();
  return nativeResult && ['success', 'canceled', 'unavailable', 'failed'].includes(nativeResult)
    ? nativeResult as DeviceAuthResult
    : null;
}

export function requestNativeDeviceAuth(title?: string, message?: string): boolean {
  const bridge = getNativeSecurityBridge();
  if (!bridge || typeof bridge.requestDeviceAuth !== 'function') return false;
  try {
    bridge.requestDeviceAuth(title, message);
    return true;
  } catch {
    return false;
  }
}
