import { describe, expect, it } from 'vitest';
import { buildTripReportModel, getTripReportCategoryKey, getTripSettlementStatus } from './tripReport';
import type { Trip } from '@/types';

const trip: Trip = {
  id: 'trip-1',
  name: 'Goa Trip',
  description: 'Friends weekend',
  startDate: Date.parse('2026-08-01T00:00:00Z'),
  endDate: Date.parse('2026-08-03T00:00:00Z'),
  createdAt: 1,
  updatedAt: 2,
  members: [
    { id: 'asha', name: 'Asha', joinedAt: 1 },
    { id: 'binu', name: 'Binu', joinedAt: 1 },
  ],
  expenses: [
    { id: 'e1', tripId: 'trip-1', description: 'Hotel', amount: 600, category: 'hotel', paidBy: 'asha', date: Date.parse('2026-08-01T00:00:00Z'), createdAt: 1, splits: { asha: 300, binu: 300 } },
    { id: 'e2', tripId: 'trip-1', description: 'Food', amount: 200, category: 'food', paidBy: 'binu', date: Date.parse('2026-08-02T00:00:00Z'), createdAt: 1, splits: { asha: 100, binu: 100 } },
  ],
};

describe('Trip Report model', () => {
  it('summarizes overview, category totals, member balances, and settlement', () => {
    const report = buildTripReportModel(trip);
    expect(report).toMatchObject({
      tripId: 'trip-1', tripName: 'Goa Trip', startDate: trip.startDate, endDate: trip.endDate,
      totalExpenses: 800, expenseCount: 2, memberCount: 2,
    });
    expect(report.categoryRows).toEqual(expect.arrayContaining([
      { category: 'hotel', amount: 600 },
      { category: 'food', amount: 200 },
    ]));
    expect(report.memberRows).toEqual(expect.arrayContaining([
      { memberId: 'asha', memberName: 'Asha', paid: 600, owed: 400, net: 200 },
      { memberId: 'binu', memberName: 'Binu', paid: 200, owed: 400, net: -200 },
    ]));
    expect(report.settlements).toEqual([{ from: 'Binu', to: 'Asha', fromId: 'binu', toId: 'asha', amount: 200, status: 'pending' }]);
  });

  it('maps a marked-as-paid settlement to Settled for the PDF report', () => {
    const report = buildTripReportModel(trip);
    const settlement = report.settlements[0];
    expect(getTripSettlementStatus(settlement, { 'binu-asha': 'paid' })).toBe('settled');
    expect(getTripSettlementStatus(settlement, {})).toBe('pending');
  });

  it('keeps the established localized category key mapping', () => {
    expect(getTripReportCategoryKey('food')).toBe('auditTripFood');
    expect(getTripReportCategoryKey('hotel')).toBe('auditTripHotel');
    expect(getTripReportCategoryKey('others')).toBe('auditTripOthers');
  });
});
