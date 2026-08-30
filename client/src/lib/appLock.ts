// Local app-lock preferences. The Android device-lock option delegates authentication to
// the phone's system credential screen through the KharchaSecurity JavaScript bridge.
const PIN_KEY = 'kharcha_lock_pin_hash';
const LOCK_ENABLED_KEY = 'kharcha_lock_enabled';
const LOCK_METHOD_KEY = 'kharcha_lock_method'; // 'pin' | 'biometric'
const AUTO_LOCK_TIMEOUT_KEY = 'kharcha_auto_lock_timeout'; // 'immediate' | '1min' | '5min'
const LAST_ACTIVE_KEY = 'kharcha_last_active_timestamp';
const LOCK_SESSION_UNLOCKED_KEY = 'kharcha_session_unlocked';

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
  } else {
    sessionStorage.removeItem(LOCK_SESSION_UNLOCKED_KEY);
  }
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
