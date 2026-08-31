export interface KharchaNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read?: boolean;
  path?: string;
  actionLabel?: string;
}

const STORAGE_KEY = 'kharcha_notifications';
const EVENT_NAME = 'kharcha-notifications-updated';

export function getNotifications(): KharchaNotification[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getUnreadNotificationCount(): number {
  return getNotifications().filter(notification => !notification.read).length;
}

export function markNotificationRead(id: string): void {
  if (typeof localStorage === 'undefined') return;
  const notifications = getNotifications().map(notification => notification.id === id ? { ...notification, read: true } : notification);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT_NAME));
}

export function markAllNotificationsRead(): void {
  if (typeof localStorage === 'undefined') return;
  const notifications = getNotifications().map(notification => ({ ...notification, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT_NAME));
}

export function subscribeToNotifications(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const onStorage = () => listener();
  window.addEventListener('storage', onStorage);
  window.addEventListener(EVENT_NAME, onStorage);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(EVENT_NAME, onStorage);
  };
}
