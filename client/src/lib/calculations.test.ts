import { describe, it, expect } from 'vitest';
import {
  calculateMemberBalances,
  calculateNetBalances,
  simplifySettlements,
  calculateCategoryBreakdown,
  generateTripSummary,
} from './calculations';
import { Trip, Member, Expense } from '@/types';

// Helper to create test data
function createTestTrip(): Trip {
  const members: Member[] = [
    { id: 'alice', name: 'Alice', joinedAt: Date.now() },
    { id: 'bob', name: 'Bob', joinedAt: Date.now() },
    { id: 'charlie', name: 'Charlie', joinedAt: Date.now() },
  ];

  const expenses: Expense[] = [
    {
      id: 'exp1',
      tripId: 'trip1',
      description: 'Dinner',
      amount: 300,
      category: 'food',
      paidBy: 'alice',
      date: Date.now(),
      splits: {
        alice: 100,
        bob: 100,
        charlie: 100,
      },
      createdAt: Date.now(),
    },
    {
      id: 'exp2',
      tripId: 'trip1',
      description: 'Hotel',
      amount: 600,
      category: 'hotel',
      paidBy: 'bob',
      date: Date.now(),
      splits: {
        alice: 200,
        bob: 200,
        charlie: 200,
      },
      createdAt: Date.now(),
    },
  ];

  return {
    id: 'trip1',
    name: 'Test Trip',
    description: 'A test trip',
    startDate: Date.now(),
    endDate: Date.now() + 86400000,
    members,
    expenses,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe('Calculations', () => {
  describe('calculateMemberBalances', () => {
    it('should calculate spent and owed amounts correctly', () => {
      const trip = createTestTrip();
      const { spent, owed } = calculateMemberBalances(trip);

      expect(spent['alice']).toBe(300); // Alice paid 300
      expect(spent['bob']).toBe(600); // Bob paid 600
      expect(spent['charlie']).toBe(0); // Charlie paid 0

      expect(owed['alice']).toBe(300); // Alice owes 300
      expect(owed['bob']).toBe(300); // Bob owes 300
      expect(owed['charlie']).toBe(300); // Charlie owes 300
    });
  });

  describe('calculateNetBalances', () => {
    it('should calculate net balance (positive = owed money, negative = owes money)', () => {
      const trip = createTestTrip();
      const balances = calculateNetBalances(trip);

      expect(balances['alice']).toBe(0); // Alice: paid 300, owes 300 = 0
      expect(balances['bob']).toBe(300); // Bob: paid 600, owes 300 = +300
      expect(balances['charlie']).toBe(-300); // Charlie: paid 0, owes 300 = -300
    });
  });

  describe('simplifySettlements', () => {
    it('should generate minimal settlement transactions', () => {
      const trip = createTestTrip();
      const settlements = simplifySettlements(trip);

      expect(settlements.length).toBeGreaterThan(0);
      expect(settlements[0]).toHaveProperty('from');
      expect(settlements[0]).toHaveProperty('to');
      expect(settlements[0]).toHaveProperty('amount');

      // Total amount to settle should equal total owed
      const totalToSettle = settlements.reduce((sum, s) => sum + s.amount, 0);
      expect(totalToSettle).toBe(300);
    });

    it('should match creditor names correctly', () => {
      const trip = createTestTrip();
      const settlements = simplifySettlements(trip);

      const names = settlements.flatMap(s => [s.from, s.to]);
      expect(names).toContain('Bob');
      expect(names).toContain('Charlie');
    });
  });

  describe('calculateCategoryBreakdown', () => {
    it('should sum expenses by category', () => {
      const trip = createTestTrip();
      const breakdown = calculateCategoryBreakdown(trip);

      expect(breakdown['food']).toBe(300);
      expect(breakdown['hotel']).toBe(600);
      expect(breakdown['transport']).toBe(0);
      expect(breakdown['shopping']).toBe(0);
    });
  });

  describe('generateTripSummary', () => {
    it('should generate complete trip summary', () => {
      const trip = createTestTrip();
      const summary = generateTripSummary(trip);

      expect(summary.tripId).toBe('trip1');
      expect(summary.totalExpenses).toBe(900);
      expect(summary.settlements.length).toBeGreaterThan(0);
      expect(summary.categoryBreakdown['food']).toBe(300);
      expect(summary.categoryBreakdown['hotel']).toBe(600);
    });
  });

  describe('Edge cases', () => {
    it('should handle trip with no expenses', () => {
      const trip: Trip = {
        id: 'trip1',
        name: 'Empty Trip',
        description: 'No expenses',
        startDate: Date.now(),
        endDate: Date.now() + 86400000,
        members: [
          { id: 'alice', name: 'Alice', joinedAt: Date.now() },
        ],
        expenses: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const summary = generateTripSummary(trip);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.settlements.length).toBe(0);
    });

    it('should handle trip with single member', () => {
      const trip: Trip = {
        id: 'trip1',
        name: 'Solo Trip',
        description: 'One person',
        startDate: Date.now(),
        endDate: Date.now() + 86400000,
        members: [
          { id: 'alice', name: 'Alice', joinedAt: Date.now() },
        ],
        expenses: [
          {
            id: 'exp1',
            tripId: 'trip1',
            description: 'Expense',
            amount: 100,
            category: 'food',
            paidBy: 'alice',
            date: Date.now(),
            splits: { alice: 100 },
            createdAt: Date.now(),
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const summary = generateTripSummary(trip);
      expect(summary.totalExpenses).toBe(100);
      expect(summary.settlements.length).toBe(0); // No debt if only one person
    });
  });
});
