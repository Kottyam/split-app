import { calculateCategoryBreakdown, calculateMemberBalances, simplifySettlements } from './calculations';
import type { ExpenseCategory, Trip } from '@/types';

export interface TripReportMemberRow {
  memberId: string;
  memberName: string;
  paid: number;
  owed: number;
  net: number;
}

export interface TripReportCategoryRow {
  category: ExpenseCategory;
  amount: number;
}

export interface TripReportModel {
  tripId: string;
  tripName: string;
  description: string;
  startDate: number;
  endDate: number;
  totalExpenses: number;
  expenseCount: number;
  memberCount: number;
  categoryRows: TripReportCategoryRow[];
  memberRows: TripReportMemberRow[];
  settlements: ReturnType<typeof simplifySettlements>;
}

export function buildTripReportModel(trip: Trip): TripReportModel {
  const { spent, owed } = calculateMemberBalances(trip);
  const categoryBreakdown = calculateCategoryBreakdown(trip);
  const memberRows = trip.members.map(member => ({
    memberId: member.id,
    memberName: member.name,
    paid: Math.round((spent[member.id] || 0) * 100) / 100,
    owed: Math.round((owed[member.id] || 0) * 100) / 100,
    net: Math.round(((spent[member.id] || 0) - (owed[member.id] || 0)) * 100) / 100,
  }));

  return {
    tripId: trip.id,
    tripName: trip.name,
    description: trip.description,
    startDate: trip.startDate,
    endDate: trip.endDate,
    totalExpenses: Math.round(trip.expenses.reduce((sum, expense) => sum + expense.amount, 0) * 100) / 100,
    expenseCount: trip.expenses.length,
    memberCount: trip.members.length,
    categoryRows: (Object.entries(categoryBreakdown) as Array<[ExpenseCategory, number]>).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
    })),
    memberRows,
    settlements: simplifySettlements(trip),
  };
}

export type TripSettlementStatusOverrides = Record<string, string | undefined>;

/** Resolve the persisted UI payment state used by Trip reports without changing settlement calculations. */
export function getTripSettlementStatus(
  settlement: TripReportModel['settlements'][number],
  overrides: TripSettlementStatusOverrides = {},
): 'pending' | 'settled' | 'received' {
  const key = `${settlement.fromId}-${settlement.toId}`;
  const status = overrides[key] ?? settlement.status ?? 'pending';
  if (status === 'paid') return 'settled';
  if (status === 'received') return 'received';
  return 'pending';
}

export function getTripReportCategoryKey(category: ExpenseCategory): string {
  return ({
    food: 'auditTripFood',
    transport: 'auditTripTransport',
    hotel: 'auditTripHotel',
    shopping: 'auditTripShopping',
    entertainment: 'auditTripEntertainment',
    others: 'auditTripOthers',
  } satisfies Record<ExpenseCategory, string>)[category];
}
