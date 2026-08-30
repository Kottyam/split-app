/**
 * Contact Picker integration for browser and Android WebView.
 *
 * Chrome's Contact Picker API is not exposed consistently inside embedded
 * Android WebViews. The Android wrapper therefore exposes a narrow native
 * bridge named KharchaContacts; the web implementation remains the fallback
 * for supported browsers.
 */

export interface ContactInfo {
  name?: string;
  tel?: string;
  email?: string;
}

type NativeContactBridge = {
  pickContacts: () => void;
};

const CONTACT_EVENT = 'kharcha-contacts-selected';

function getNativeContactBridge(): NativeContactBridge | null {
  if (typeof window === 'undefined') return null;
  const bridge = (window as Window & { KharchaContacts?: NativeContactBridge }).KharchaContacts;
  return bridge && typeof bridge.pickContacts === 'function' ? bridge : null;
}

function isBrowserContactPickerSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'contacts' in navigator &&
    'ContactsManager' in window
  );
}

function normaliseContacts(contacts: unknown): ContactInfo[] {
  if (!Array.isArray(contacts)) return [];
  return contacts.map((contact) => {
    const value = contact as { name?: unknown; tel?: unknown; email?: unknown };
    return {
      name: Array.isArray(value.name) ? String(value.name[0] ?? '') : String(value.name ?? ''),
      tel: Array.isArray(value.tel) ? String(value.tel[0] ?? '') : String(value.tel ?? ''),
      email: Array.isArray(value.email) ? String(value.email[0] ?? '') : String(value.email ?? ''),
    };
  });
}

async function pickFromNativeBridge(): Promise<ContactInfo[]> {
  const bridge = getNativeContactBridge();
  if (!bridge || typeof window === 'undefined') return [];

  return new Promise<ContactInfo[]>((resolve) => {
    let settled = false;
    const finish = (contacts: unknown) => {
      if (settled) return;
      settled = true;
      window.removeEventListener(CONTACT_EVENT, onSelected as EventListener);
      window.clearTimeout(timeoutId);
      resolve(normaliseContacts(contacts));
    };
    const onSelected = (event: Event) => {
      finish((event as CustomEvent<unknown>).detail);
    };
    const timeoutId = window.setTimeout(() => finish([]), 30_000);

    window.addEventListener(CONTACT_EVENT, onSelected as EventListener, { once: true });
    try {
      bridge.pickContacts();
    } catch (error) {
      console.error('Failed to open native contact picker:', error);
      finish([]);
    }
  });
}

async function pickFromBrowser(multiple: boolean): Promise<ContactInfo[]> {
  if (!isBrowserContactPickerSupported()) return [];
  try {
    const contactsManager = (navigator as Navigator & { contacts?: { select: Function } }).contacts;
    if (!contactsManager) return [];
    const contacts = await contactsManager.select(['name', 'tel', 'email'], { multiple });
    return normaliseContacts(contacts);
  } catch (error) {
    console.error('Failed to pick contact:', error);
    return [];
  }
}

/** Check whether either the Android native bridge or browser Contact Picker is available. */
export function isContactPickerSupported(): boolean {
  return Boolean(getNativeContactBridge()) || isBrowserContactPickerSupported();
}

/** Request one contact, using the same native picker and taking the first selection. */
export async function pickContact(): Promise<ContactInfo | null> {
  const contacts = getNativeContactBridge()
    ? await pickFromNativeBridge()
    : await pickFromBrowser(false);
  return contacts[0] ?? null;
}

/** Request one or more contacts from the device. */
export async function pickMultipleContacts(): Promise<ContactInfo[]> {
  return getNativeContactBridge()
    ? pickFromNativeBridge()
    : pickFromBrowser(true);
}

/** Format phone number to 10 digits (India). */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-10);
}

/** Validate phone number format. */
export function isValidPhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 && /^[6-9]/.test(digits);
}
