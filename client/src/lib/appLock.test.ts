import { beforeEach, describe, expect, it } from 'vitest';
import {
  checkAutoLockOnActivity,
  consumeNativeDeviceAuthResult,
  getLockMethod,
  isAppLockEnabled,
  isNativeDeviceAuthAvailable,
  isSessionUnlocked,
  requestNativeDeviceAuth,
  setAppLockConfig,
  setSessionUnlocked,
  verifyPin,
} from './appLock';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

describe('app lock', () => {
  beforeEach(() => {
    Object.assign(globalThis, {
      localStorage: new MemoryStorage(),
      sessionStorage: new MemoryStorage(),
      window: { dispatchEvent: () => true },
    });
  });

  it('requires a fresh session unlock after enabling PIN protection', () => {
    setAppLockConfig(true, 'pin', 'immediate', '2468');
    expect(isAppLockEnabled()).toBe(true);
    expect(getLockMethod()).toBe('pin');
    expect(isSessionUnlocked()).toBe(false);
    expect(verifyPin('2468')).toBe(true);
    expect(verifyPin('1357')).toBe(false);

    setSessionUnlocked(true);
    expect(isSessionUnlocked()).toBe(true);
  });

  it('saves device-lock mode without requiring a PIN', () => {
    setAppLockConfig(true, 'biometric', 'immediate');
    expect(isAppLockEnabled()).toBe(true);
    expect(getLockMethod()).toBe('biometric');
    expect(isSessionUnlocked()).toBe(false);
    expect(verifyPin('2468')).toBe(false);
  });

  it('locks an unlocked session after the configured timeout', () => {
    setAppLockConfig(true, 'pin', '1min', '2468');
    setSessionUnlocked(true);
    (globalThis.localStorage as MemoryStorage).setItem(
      'kharcha_last_active_timestamp',
      String(Date.now() - 61_000),
    );

    expect(checkAutoLockOnActivity()).toBe(true);
    expect(isSessionUnlocked()).toBe(false);
  });

  it('consumes a persisted native-auth result only once', () => {
    (globalThis.localStorage as MemoryStorage).setItem('kharcha_native_device_auth_result', 'success');

    expect(consumeNativeDeviceAuthResult()).toBe('success');
    expect(consumeNativeDeviceAuthResult()).toBeNull();
  });

  it('uses the native Android bridge for device authentication when available', () => {
    let requested = 0;
    Object.assign(globalThis, {
      window: {
        dispatchEvent: () => true,
        KharchaSecurity: {
          isDeviceAuthAvailable: () => true,
          requestDeviceAuth: () => { requested += 1; },
          consumeDeviceAuthResult: () => 'success',
        },
      },
    });

    expect(isNativeDeviceAuthAvailable()).toBe(true);
    expect(requestNativeDeviceAuth()).toBe(true);
    expect(consumeNativeDeviceAuthResult()).toBe('success');
    expect(requested).toBe(1);
  });
});
