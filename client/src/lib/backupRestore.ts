import { getAllTrips } from './storage';
import { getAllSharedHomes } from '../sharedHome/storage';
import { getGroupFunds } from '../groupFund/storage';

export interface KharchaBackupPayload {
  app: 'Kharcha';
  backupVersion: number;
  createdAt: string;
  data: {
    trips: any[];
    sharedHomes: any[];
    groupFunds: any[];
  };
}

export function generateBackupPayload(): KharchaBackupPayload {
  const trips = getAllTrips();
  const sharedHomes = getAllSharedHomes();
  const groupFunds = getGroupFunds();

  return {
    app: 'Kharcha',
    backupVersion: 1,
    createdAt: new Date().toISOString(),
    data: {
      trips,
      sharedHomes,
      groupFunds,
    },
  };
}

export function validateBackupJson(raw: string): { valid: boolean; error?: string; payload?: KharchaBackupPayload; summary?: any } {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.app !== 'Kharcha') {
      return { valid: false, error: 'This file cannot be restored because it is corrupted or is not a valid Kharcha backup.' };
    }
    if (typeof parsed.backupVersion !== 'number' || parsed.backupVersion < 1) {
      return { valid: false, error: 'Unsupported or invalid backup version.' };
    }
    if (!parsed.data || typeof parsed.data !== 'object') {
      return { valid: false, error: 'Backup data payload is missing.' };
    }

    const trips = Array.isArray(parsed.data.trips) ? parsed.data.trips : [];
    const sharedHomes = Array.isArray(parsed.data.sharedHomes) ? parsed.data.sharedHomes : [];
    const groupFunds = Array.isArray(parsed.data.groupFunds) ? parsed.data.groupFunds : [];

    return {
      valid: true,
      payload: parsed as KharchaBackupPayload,
      summary: {
        tripsCount: trips.length,
        sharedHomesCount: sharedHomes.length,
        groupFundsCount: groupFunds.length,
        createdAt: parsed.createdAt,
      },
    };
  } catch {
    return { valid: false, error: 'Invalid JSON file format. Please select a valid Kharcha backup JSON file.' };
  }
}

export function restoreBackupPayload(payload: KharchaBackupPayload): { tripsCount: number; sharedHomesCount: number; groupFundsCount: number; transactionsCount: number; goalsCount: number } {
  const { trips, sharedHomes, groupFunds } = payload.data;

  // Restore trips
  localStorage.setItem('kharcha_trips', JSON.stringify(Array.isArray(trips) ? trips : []));
  // Restore shared homes
  localStorage.setItem('kharcha_shared_homes', JSON.stringify(Array.isArray(sharedHomes) ? sharedHomes : []));
  // Restore group funds
  localStorage.setItem('kharcha_group_funds', JSON.stringify(Array.isArray(groupFunds) ? groupFunds : []));
  // Record last backup restore time
  localStorage.setItem('kharcha_last_restore_at', new Date().toISOString());

  return {
    tripsCount: Array.isArray(trips) ? trips.length : 0,
    sharedHomesCount: Array.isArray(sharedHomes) ? sharedHomes.length : 0,
    groupFundsCount: Array.isArray(groupFunds) ? groupFunds.length : 0,
    transactionsCount: 0,
    goalsCount: 0,
  };
}
