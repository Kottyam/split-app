import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  MAX_PIN_ATTEMPTS,
  PIN_COOLDOWN_MS,
  attemptPinUnlock,
  canEnforceAppLock,
  checkAutoLockOnResume,
  clearPin,
  getPinCooldownRemainingMs,
  hasPinConfigured,
  isSessionUnlocked,
  isValidPin,
  markAppBackgrounded,
  setAppLockConfig,
  setSessionUnlocked,
  shouldShowLockScreen,
} from './appLock';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

function installStorage(bridge?: Record<string, unknown>) {
  Object.assign(globalThis, {
    localStorage: new MemoryStorage(),
    sessionStorage: new MemoryStorage(),
    window: { dispatchEvent: () => true, ...(bridge ? { KharchaSecurity: bridge } : {}) },
  });
}

describe('app lock wiring rules', () => {
  beforeEach(() => installStorage());

  it('validates 4 to 6 digit PINs only', () => {
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('12345')).toBe(true);
    expect(isValidPin('123456')).toBe(true);
    expect(isValidPin('1234567')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
  });

  it('locks on a cold start (fresh session) once a PIN lock is enabled', () => {
    setAppLockConfig(true, 'pin', 'immediate', '2468');
    expect(shouldShowLockScreen()).toBe(true);
    setSessionUnlocked(true);
    expect(shouldShowLockScreen()).toBe(false);
    // New tab / relaunched app = new sessionStorage.
    (globalThis as any).sessionStorage = new MemoryStorage();
    expect(shouldShowLockScreen()).toBe(true);
  });

  it('never shows an unpassable lock screen (phone lock without PIN and no sensor/bridge)', () => {
    setAppLockConfig(true, 'biometric', 'immediate');
    expect(hasPinConfigured()).toBe(false);
    expect(canEnforceAppLock()).toBe(false);
    expect(shouldShowLockScreen()).toBe(false);
  });

  it('enforces phone-lock mode when the Android bridge is available', () => {
    installStorage({ isDeviceAuthAvailable: () => true, requestDeviceAuth: () => undefined });
    setAppLockConfig(true, 'biometric', 'immediate');
    expect(canEnforceAppLock()).toBe(true);
    expect(shouldShowLockScreen()).toBe(true);
  });

  it('keeps the PIN as a working fallback in fingerprint mode when biometrics are unavailable', () => {
    installStorage({ isDeviceAuthAvailable: () => false });
    setAppLockConfig(true, 'biometric', 'immediate', '135790');
    expect(shouldShowLockScreen()).toBe(true);
    expect(attemptPinUnlock('135790')).toEqual({ ok: true });
    expect(isSessionUnlocked()).toBe(true);
  });

  it('counts wrong PINs and applies a short cool-down, then lets the right PIN in', () => {
    setAppLockConfig(true, 'pin', 'immediate', '2468');
    const now = 1_000_000;
    for (let attempt = 1; attempt < MAX_PIN_ATTEMPTS; attempt += 1) {
      const result = attemptPinUnlock('0000', now);
      expect(result).toEqual({ ok: false, reason: 'incorrect', attemptsLeft: MAX_PIN_ATTEMPTS - attempt, cooldownMs: 0 });
    }
    expect(attemptPinUnlock('0000', now)).toEqual({ ok: false, reason: 'incorrect', attemptsLeft: 0, cooldownMs: PIN_COOLDOWN_MS });
    // Even the right PIN waits for the cool-down.
    expect(attemptPinUnlock('2468', now + 1000)).toMatchObject({ ok: false, reason: 'cooldown' });
    expect(getPinCooldownRemainingMs(now + PIN_COOLDOWN_MS + 1)).toBe(0);
    expect(attemptPinUnlock('2468', now + PIN_COOLDOWN_MS + 1)).toEqual({ ok: true });
    // Counter resets after a successful unlock.
    expect(attemptPinUnlock('0000', now + PIN_COOLDOWN_MS + 2)).toMatchObject({ attemptsLeft: MAX_PIN_ATTEMPTS - 1 });
  });

  it('caps a cool-down left behind by a clock change', () => {
    setAppLockConfig(true, 'pin', 'immediate', '2468');
    localStorage.setItem('kharcha_lock_cooldown_until', String(Date.now() + 10 * 60 * 60 * 1000));
    expect(getPinCooldownRemainingMs()).toBeLessThanOrEqual(PIN_COOLDOWN_MS);
  });

  it('relocks after the app was in the background longer than the auto-lock time', () => {
    setAppLockConfig(true, 'pin', '1min', '2468');
    setSessionUnlocked(true);
    markAppBackgrounded(10_000);
    expect(checkAutoLockOnResume(10_000 + 30_000)).toBe(false);
    expect(isSessionUnlocked()).toBe(true);
    markAppBackgrounded(100_000);
    expect(checkAutoLockOnResume(100_000 + 61_000)).toBe(true);
    expect(isSessionUnlocked()).toBe(false);
  });

  it('immediate mode relocks on any return from the background, but not on a bare resume event', () => {
    setAppLockConfig(true, 'pin', 'immediate', '2468');
    setSessionUnlocked(true);
    // Resume without a matching background (e.g. the fingerprint sheet closing) never relocks.
    expect(checkAutoLockOnResume(5_000)).toBe(false);
    markAppBackgrounded(5_000);
    expect(checkAutoLockOnResume(5_001)).toBe(true);
  });

  it('turning the lock off and clearing the PIN leaves nothing that can lock the owner out', () => {
    setAppLockConfig(true, 'pin', 'immediate', '2468');
    clearPin();
    setAppLockConfig(false, 'pin', 'immediate');
    expect(hasPinConfigured()).toBe(false);
    expect(shouldShowLockScreen()).toBe(false);
    expect(checkAutoLockOnResume()).toBe(false);
  });
});

describe('app lock and theme are mounted in the app shell', () => {
  const root = resolve(import.meta.dirname, '../../..');
  const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

  it('wraps every route in AppLockGate inside the theme and language providers', () => {
    const app = read('client/src/App.tsx');
    expect(app).toContain('<ThemeProvider switchable>');
    expect(app).toMatch(/<AppLockGate>\s*<AppShell \/>\s*<\/AppLockGate>/);
    expect(app.indexOf('<LanguageProvider>')).toBeLessThan(app.indexOf('<AppLockGate>'));
  });

  it('listens for background/resume events and keeps the PIN fallback on the lock screen', () => {
    const gate = read('client/src/components/AppLockGate.tsx');
    expect(gate).toContain("'kharcha-app-resume'");
    expect(gate).toContain('markAppBackgrounded()');
    expect(gate).toContain('checkAutoLockOnResume()');
    expect(gate).toContain('attemptPinUnlock(pin)');
    expect(gate).toContain("t('forgotPin' as any)");
  });

  it('settings require a backup PIN for fingerprint mode and clear the PIN when the lock is turned off', () => {
    const settings = read('client/src/components/AppSettingsDialogExtended.tsx');
    expect(settings).toContain('clearPin()');
    expect(settings).toContain('isValidPin(pinInput)');
    expect(settings).toContain('data-theme-option');
  });
});
