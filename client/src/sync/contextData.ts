import type { Snapshot, SyncKind } from './serverlessSync';
import { getAllTrips, saveTrip } from '@/lib/storage';
import { getAllSharedHomes, saveSharedHome } from '@/sharedHome/storage';
import { getGroupFunds, saveGroupFund } from '@/groupFund/storage';
import type { Trip } from '@/types';
import type { SharedHome } from '@/sharedHome/types';
import type { GroupFund } from '@/groupFund/types';

export function loadSnapshot(type: SyncKind, id: string): Snapshot | undefined {
  const list: unknown[] = type === 'trip' ? getAllTrips() : type === 'shared_home' ? getAllSharedHomes() : getGroupFunds();
  return (list as Snapshot[]).find(item => item.id === id);
}
export function storeSnapshot(type: SyncKind, snap: Snapshot) {
  if (type === 'trip') saveTrip(snap as unknown as Trip);
  else if (type === 'shared_home') saveSharedHome(snap as unknown as SharedHome);
  else saveGroupFund(snap as unknown as GroupFund);
}
export function routeFor(type: SyncKind, id: string) {
  return type === 'trip' ? `/trip/${id}` : type === 'shared_home' ? `/shared-home/${id}` : `/group-fund/${id}`;
}
export const kindLabel = (type: SyncKind) => (type === 'trip' ? 'trip' : type === 'shared_home' ? 'shared home' : 'Group Fund');
/** i18n key for the kind noun; render with t(). */
export const kindLabelKey = (type: SyncKind) => (type === 'trip' ? 'syncKindTrip' : type === 'shared_home' ? 'syncKindSharedHome' : 'syncKindGroupFund');
