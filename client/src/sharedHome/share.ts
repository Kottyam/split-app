import { compressData, decompressData } from '@/lib/compression';
import { shareLink } from '@/lib/shareLink';
import type { SharedHome, SharedHomeSnapshot } from './types';
import { monthBounds, monthKeyFromDate } from './calculations';

interface CompactSharedHomePayload {
  v: 1;
  t: 'shared_home';
  n: string;
  ht: SharedHome['homeType'];
  sd: number;
  d?: string;
  m: Array<[string, string, string, number, number | undefined, string | undefined]>;
  r: Array<[string, string, number | undefined, string | undefined, string[]]>;
  rp: SharedHome['rentPeriods'];
  e: Array<[string, string, string, number, number, number, number[], string, Record<string, number>, string?]>;
  st: SharedHome['settlements'];
  mo: SharedHome['months'];
  mb?: SharedHome['monthlyBudgets'];
  bs?: SharedHome['budgetSettings'];
  g: number;
  rg?: { s?: number; e?: number };
}

export type SharedHomeShareRange = 'current-month' | 'full-group' | 'date-range';

export function createSharedHomeSnapshot(
  home: SharedHome,
  range: SharedHomeShareRange = 'current-month',
  dateRange?: { startDate?: number; endDate?: number },
): SharedHomeSnapshot {
  const now = Date.now();
  const currentMonth = monthKeyFromDate(now);
  let startDate = dateRange?.startDate;
  let endDate = dateRange?.endDate;
  if (range === 'current-month') {
    const [year, month] = currentMonth.split('-').map(Number);
    startDate = Date.UTC(year, month - 1, 1);
    endDate = Date.UTC(year, month, 1) - 1;
  }
  const inRange = (date: number) => (startDate === undefined || date >= startDate) && (endDate === undefined || date <= endDate);
  const monthInRange = (monthKey: string) => {
    if (range === 'full-group' || (startDate === undefined && endDate === undefined)) return true;
    const bounds = monthBounds(monthKey);
    return bounds.end >= (startDate ?? Number.NEGATIVE_INFINITY) && bounds.start <= (endDate ?? Number.POSITIVE_INFINITY);
  };
  const memberIndex = new Map(home.members.map((member, index) => [member.id, index]));
  const expenses = home.expenses.filter(expense => inRange(expense.date));
  const monthlyBudgets = home.monthlyBudgets ? Object.fromEntries(Object.entries(home.monthlyBudgets).filter(([monthKey]) => monthInRange(monthKey))) : undefined;
  const snapshot: SharedHomeSnapshot = {
    type: 'shared_home',
    home: {
      id: home.id,
      name: home.name,
      homeType: home.homeType,
      startDate: home.startDate,
      description: home.description,
      members: home.members.map(member => ({ ...member })),
      rooms: home.rooms.map(room => ({ ...room, memberIds: [...room.memberIds] })),
      rentPeriods: home.rentPeriods.filter(period => monthInRange(period.monthKey)),
      expenses,
      settlements: home.settlements.filter(settlement => inRange(settlement.date)),
      months: Object.fromEntries(Object.entries(home.months).filter(([key]) => monthInRange(key))),
      monthlyBudgets,
      budgetSettings: home.budgetSettings,
    },
    generatedAt: now,
    range: startDate === undefined && endDate === undefined ? undefined : { startDate, endDate },
  };
  // Reference memberIndex so future compact transformations cannot accidentally drop orphaned ids.
  void memberIndex;
  return snapshot;
}

export function encodeSharedHomeSnapshot(snapshot: SharedHomeSnapshot): string {
  const home = snapshot.home;
  const memberIndex = new Map(home.members.map((member, index) => [member.id, index]));
  const payload: CompactSharedHomePayload = {
    v: 1,
    t: 'shared_home',
    n: home.name,
    ht: home.homeType,
    sd: home.startDate,
    d: home.description,
    m: home.members.map(member => [member.name, '', member.avatar ?? '', member.moveInDate, member.moveOutDate, member.isActive ? '1' : '0']),
    r: home.rooms.map(room => [room.name, String(room.defaultRent ?? ''), room.defaultRent, room.notes, room.memberIds.map(id => String(memberIndex.get(id) ?? -1))]),
    rp: home.rentPeriods,
    e: home.expenses.map(expense => [expense.name, expense.category, expense.kind, expense.amount, expense.date, memberIndex.get(expense.paidBy) ?? -1, expense.sharedBy.map(id => memberIndex.get(id) ?? -1), expense.splitMethod, Object.fromEntries(Object.entries(expense.shares).map(([id, amount]) => [String(memberIndex.get(id) ?? -1), amount])), expense.notes]),
    st: home.settlements,
    mo: home.months,
    mb: home.monthlyBudgets,
    bs: home.budgetSettings,
    g: snapshot.generatedAt,
    rg: snapshot.range ? { s: snapshot.range.startDate, e: snapshot.range.endDate } : undefined,
  };
  return compressData(JSON.stringify(payload));
}

export function decodeSharedHomeSnapshot(encoded: string): SharedHomeSnapshot | null {
  try {
    const json = decompressData(decodeURIComponent(encoded));
    const payload = JSON.parse(json) as CompactSharedHomePayload;
    if (payload?.v !== 1 || payload.t !== 'shared_home') return null;
    const members = (payload.m ?? []).map((member, index) => ({
      id: `shared-home-member-${index}`,
      name: member[0] ?? '',
      mobileNumber: member[1] ?? '',
      avatar: member[2] || undefined,
      moveInDate: Number(member[3]) || 0,
      moveOutDate: member[4] ? Number(member[4]) : undefined,
      isActive: member[5] !== '0',
      roomAssignments: [],
      createdAt: Date.now(),
    }));
    const rooms = (payload.r ?? []).map((room, index) => ({
      id: `shared-home-room-${index}`,
      name: room[0] ?? '',
      defaultRent: room[2] === undefined ? undefined : Number(room[2]),
      notes: room[3] || undefined,
      memberIds: (room[4] ?? []).map(indexText => members[Number(indexText)]?.id).filter(Boolean),
      createdAt: Date.now(),
    }));
    const expenses = (payload.e ?? []).map((expense, index) => ({
      id: `shared-home-expense-${index}`,
      kind: expense[2] as SharedHome['expenses'][number]['kind'],
      name: expense[0] ?? '',
      category: expense[1] ?? 'Other',
      amount: Number(expense[3]) || 0,
      date: Number(expense[4]) || 0,
      paidBy: members[expense[5]]?.id ?? '',
      sharedBy: (expense[6] ?? []).map(indexValue => members[indexValue]?.id).filter(Boolean),
      splitMethod: expense[7] as SharedHome['expenses'][number]['splitMethod'],
      shares: Object.fromEntries(Object.entries(expense[8] ?? {}).map(([memberId, amount]) => [members[Number(memberId)]?.id ?? memberId, Number(amount)])),
      notes: expense[9],
      status: 'active' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    return {
      type: 'shared_home',
      home: {
        id: `shared-home-${Date.now()}`,
        name: payload.n ?? 'Shared Home',
        homeType: payload.ht ?? 'other',
        startDate: Number(payload.sd) || 0,
        description: payload.d,
        members,
        rooms,
        rentPeriods: payload.rp ?? [],
        expenses,
        settlements: payload.st ?? [],
        months: payload.mo ?? {},
        monthlyBudgets: payload.mb,
        budgetSettings: payload.bs,
      },
      generatedAt: Number(payload.g) || Date.now(),
      range: payload.rg ? { startDate: payload.rg.s, endDate: payload.rg.e } : undefined,
    };
  } catch {
    return null;
  }
}

export function generateSharedHomeShareLink(
  home: SharedHome,
  range: SharedHomeShareRange = 'current-month',
  dateRange?: { startDate?: number; endDate?: number },
): string {
  const payload = encodeSharedHomeSnapshot(createSharedHomeSnapshot(home, range, dateRange));
  return `${window.location.origin}/shared-home-share/${payload}`;
}

export async function shareSharedHome(
  home: SharedHome,
  range: SharedHomeShareRange = 'current-month',
  dateRange?: { startDate?: number; endDate?: number },
  subtitle?: string,
): Promise<boolean> {
  const url = generateSharedHomeShareLink(home, range, dateRange);
  return shareLink(home.name, subtitle ?? `${home.name} — view-only Shared Home summary`, url);
}
