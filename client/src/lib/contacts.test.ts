import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatPhoneNumber,
  isContactPickerSupported,
  pickContact,
  pickMultipleContacts,
} from './contacts';

describe('contact picker integration', () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    if (originalWindow) {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
        writable: true,
      });
    } else {
      delete (globalThis as typeof globalThis & { window?: Window }).window;
    }
  });

  it('normalises Indian phone numbers without changing existing behavior', () => {
    expect(formatPhoneNumber('+91 98765 43210')).toBe('9876543210');
  });

  it('uses the Android bridge for multiple selected contacts', async () => {
    const listeners = new Map<string, EventListener>();
    const bridge = {
      pickContacts: vi.fn(() => {
        setTimeout(() => {
          listeners.get('kharcha-contacts-selected')?.({
            type: 'kharcha-contacts-selected',
            detail: [
              { name: 'Anu', tel: '+91 98765 43210' },
              { name: 'Binu', tel: '9123456789' },
            ],
          } as CustomEvent);
        }, 0);
      }),
    };
    const fakeWindow = {
      KharchaContacts: bridge,
      addEventListener: (type: string, listener: EventListener) => listeners.set(type, listener),
      removeEventListener: (type: string) => listeners.delete(type),
      setTimeout,
      clearTimeout,
    } as unknown as Window;

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: fakeWindow,
      writable: true,
    });

    expect(isContactPickerSupported()).toBe(true);
    await expect(pickMultipleContacts()).resolves.toEqual([
      { name: 'Anu', tel: '+91 98765 43210', email: '' },
      { name: 'Binu', tel: '9123456789', email: '' },
    ]);
    expect(bridge.pickContacts).toHaveBeenCalledTimes(1);
  });

  it('returns the first Android contact for single-contact callers', async () => {
    const listeners = new Map<string, EventListener>();
    const fakeWindow = {
      KharchaContacts: {
        pickContacts: vi.fn(() => {
          setTimeout(() => listeners.get('kharcha-contacts-selected')?.({
            type: 'kharcha-contacts-selected',
            detail: [{ name: 'Chitra', tel: '9876543210' }],
          } as CustomEvent), 0);
        }),
      },
      addEventListener: (type: string, listener: EventListener) => listeners.set(type, listener),
      removeEventListener: (type: string) => listeners.delete(type),
      setTimeout,
      clearTimeout,
    } as unknown as Window;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: fakeWindow,
      writable: true,
    });

    await expect(pickContact()).resolves.toEqual({
      name: 'Chitra',
      tel: '9876543210',
      email: '',
    });
  });
});
