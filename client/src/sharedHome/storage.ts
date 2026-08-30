import type { SharedHome } from './types';

const LEGACY_SHARED_HOME_KEY = 'kharcha_shared_homes';

function getStorageKey(userId?: string | number): string {
  return userId ? `kharcha_shared_homes_user_${userId}` : LEGACY_SHARED_HOME_KEY;
}

function parseHomes(value: string | null): SharedHome[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function initializeSharedHomeStorage(userId?: string | number): void {
  const key = getStorageKey(userId);
  if (localStorage.getItem(key) !== null) return;

  const legacy = localStorage.getItem(LEGACY_SHARED_HOME_KEY);
  if (legacy && userId) {
    localStorage.setItem(key, legacy);
  } else {
    localStorage.setItem(key, '[]');
  }
}

export function getAllSharedHomes(userId?: string | number): SharedHome[] {
  initializeSharedHomeStorage(userId);
  return parseHomes(localStorage.getItem(getStorageKey(userId)));
}

export function getSharedHomeById(homeId: string, userId?: string | number): SharedHome | null {
  return getAllSharedHomes(userId).find(home => home.id === homeId) ?? null;
}

export function saveSharedHome(home: SharedHome, userId?: string | number): void {
  const homes = getAllSharedHomes(userId);
  const index = homes.findIndex(existing => existing.id === home.id);
  if (index >= 0) homes[index] = home;
  else homes.push(home);
  localStorage.setItem(getStorageKey(userId), JSON.stringify(homes));
}

export function deleteSharedHome(homeId: string, userId?: string | number): void {
  const homes = getAllSharedHomes(userId).filter(home => home.id !== homeId);
  localStorage.setItem(getStorageKey(userId), JSON.stringify(homes));
}

export function clearSharedHomeData(userId?: string | number): void {
  localStorage.removeItem(getStorageKey(userId));
  initializeSharedHomeStorage(userId);
}
