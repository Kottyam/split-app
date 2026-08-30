import { Trip } from '@/types';

const LEGACY_STORAGE_KEY = 'kharcha_trips';

function getStorageKey(userId?: string | number): string {
  return userId ? `kharcha_trips_user_${userId}` : LEGACY_STORAGE_KEY;
}

/**
 * Initialize storage with user scoping and automatic migration of legacy trips
 */
export function initializeStorage(userId?: string | number): void {
  const userKey = getStorageKey(userId);
  if (!localStorage.getItem(userKey)) {
    // Check if legacy trips exist and migrate them to the first logged-in user
    const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyData && userId) {
      try {
        const legacyTrips = JSON.parse(legacyData);
        localStorage.setItem(userKey, JSON.stringify(legacyTrips));
        console.log('[Storage] Migrated legacy trips to user:', userId);
      } catch {
        localStorage.setItem(userKey, JSON.stringify([]));
      }
    } else {
      localStorage.setItem(userKey, JSON.stringify([]));
    }
  }
}

/**
 * Get all trips for the authenticated user from local storage
 */
export function getAllTrips(userId?: string | number): Trip[] {
  initializeStorage(userId);
  const userKey = getStorageKey(userId);
  const data = localStorage.getItem(userKey);
  return data ? JSON.parse(data) : [];
}

/**
 * Get a single trip by ID for the user
 */
export function getTripById(tripId: string, userId?: string | number): Trip | null {
  const trips = getAllTrips(userId);
  return trips.find(t => t.id === tripId) || null;
}

/**
 * Save or update a trip for the user
 */
export function saveTrip(trip: Trip, userId?: string | number): void {
  const trips = getAllTrips(userId);
  const index = trips.findIndex(t => t.id === trip.id);
  
  if (index >= 0) {
    trips[index] = trip;
  } else {
    trips.push(trip);
  }
  
  const userKey = getStorageKey(userId);
  localStorage.setItem(userKey, JSON.stringify(trips));
}

/**
 * Delete a trip by ID for the user
 */
export function deleteTrip(tripId: string, userId?: string | number): void {
  const trips = getAllTrips(userId);
  const filtered = trips.filter(t => t.id !== tripId);
  const userKey = getStorageKey(userId);
  localStorage.setItem(userKey, JSON.stringify(filtered));
}

/**
 * Clear all data for user
 */
export function clearAllData(userId?: string | number): void {
  const userKey = getStorageKey(userId);
  localStorage.removeItem(userKey);
  initializeStorage(userId);
}
