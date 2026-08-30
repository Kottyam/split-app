import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead, subscribeToNotifications } from './notifications';

describe('local notification store', () => {
  const values = new Map<string, string>();
  const listeners = new Set<() => void>();

  beforeEach(() => {
    values.clear();
    listeners.clear();
    vi.stubGlobal('localStorage', {
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    vi.stubGlobal('window', {
      addEventListener: (_name: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_name: string, listener: () => void) => listeners.delete(listener),
      dispatchEvent: () => { listeners.forEach(listener => listener()); return true; },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('returns an empty list and zero unread count when no notification state exists', () => {
    localStorage.clear();
    expect(getNotifications()).toEqual([]);
    expect(getUnreadNotificationCount()).toBe(0);
  });

  it('marks one notification and then all notifications as read', () => {
    localStorage.setItem('kharcha_notifications', JSON.stringify([
      { id: 'one', title: 'One', message: 'First', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'two', title: 'Two', message: 'Second', createdAt: '2026-01-01T00:00:00.000Z', read: true },
    ]));
    expect(getUnreadNotificationCount()).toBe(1);
    markNotificationRead('one');
    expect(getUnreadNotificationCount()).toBe(0);
    localStorage.setItem('kharcha_notifications', JSON.stringify([{ id: 'three', title: 'Three', message: 'Third', createdAt: '2026-01-01T00:00:00.000Z' }]));
    markAllNotificationsRead();
    expect(getNotifications()[0].read).toBe(true);
  });

  it('notifies subscribers when the local state changes', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToNotifications(listener);
    window.dispatchEvent(new Event('kharcha-notifications-updated'));
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
