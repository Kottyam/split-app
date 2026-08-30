import { describe, it, expect } from 'vitest';
import { Expense } from '@/types';

// Helper to create test expenses
function createTestExpenses(): Expense[] {
  return [
    {
      id: 'exp1',
      tripId: 'trip1',
      description: 'Dinner',
      amount: 300,
      category: 'food',
      paidBy: 'alice',
      date: new Date('2026-01-15').getTime(),
      splits: { alice: 100, bob: 100, charlie: 100 },
      createdAt: Date.now(),
    },
    {
      id: 'exp2',
      tripId: 'trip1',
      description: 'Breakfast',
      amount: 150,
      category: 'food',
      paidBy: 'bob',
      date: new Date('2026-01-16').getTime(),
      splits: { alice: 75, bob: 75 },
      createdAt: Date.now(),
    },
    {
      id: 'exp3',
      tripId: 'trip1',
      description: 'Taxi',
      amount: 500,
      category: 'transport',
      paidBy: 'charlie',
      date: new Date('2026-01-14').getTime(),
      splits: { alice: 250, bob: 250 },
      createdAt: Date.now(),
    },
  ];
}

describe('Expense Sorting', () => {
  describe('Sort by date', () => {
    it('should sort by date newest first', () => {
      const expenses = createTestExpenses();
      const sorted = [...expenses].sort((a, b) => b.date - a.date);

      expect(sorted[0].description).toBe('Breakfast'); // 2026-01-16
      expect(sorted[1].description).toBe('Dinner'); // 2026-01-15
      expect(sorted[2].description).toBe('Taxi'); // 2026-01-14
    });

    it('should sort by date oldest first', () => {
      const expenses = createTestExpenses();
      const sorted = [...expenses].sort((a, b) => a.date - b.date);

      expect(sorted[0].description).toBe('Taxi'); // 2026-01-14
      expect(sorted[1].description).toBe('Dinner'); // 2026-01-15
      expect(sorted[2].description).toBe('Breakfast'); // 2026-01-16
    });
  });

  describe('Sort by amount', () => {
    it('should sort by amount highest first', () => {
      const expenses = createTestExpenses();
      const sorted = [...expenses].sort((a, b) => b.amount - a.amount);

      expect(sorted[0].amount).toBe(500); // Taxi
      expect(sorted[1].amount).toBe(300); // Dinner
      expect(sorted[2].amount).toBe(150); // Breakfast
    });

    it('should sort by amount lowest first', () => {
      const expenses = createTestExpenses();
      const sorted = [...expenses].sort((a, b) => a.amount - b.amount);

      expect(sorted[0].amount).toBe(150); // Breakfast
      expect(sorted[1].amount).toBe(300); // Dinner
      expect(sorted[2].amount).toBe(500); // Taxi
    });
  });

  describe('Sort by name', () => {
    it('should sort by description alphabetically', () => {
      const expenses = createTestExpenses();
      const sorted = [...expenses].sort((a, b) => a.description.localeCompare(b.description));

      expect(sorted[0].description).toBe('Breakfast');
      expect(sorted[1].description).toBe('Dinner');
      expect(sorted[2].description).toBe('Taxi');
    });
  });

  describe('Sort by paid by', () => {
    it('should sort by payer name alphabetically', () => {
      const expenses = createTestExpenses();
      const memberMap = new Map([
        ['alice', 'Alice'],
        ['bob', 'Bob'],
        ['charlie', 'Charlie'],
      ]);

      const sorted = [...expenses].sort((a, b) => {
        const nameA = memberMap.get(a.paidBy) || '';
        const nameB = memberMap.get(b.paidBy) || '';
        return nameA.localeCompare(nameB);
      });

      expect(memberMap.get(sorted[0].paidBy)).toBe('Alice');
      expect(memberMap.get(sorted[1].paidBy)).toBe('Bob');
      expect(memberMap.get(sorted[2].paidBy)).toBe('Charlie');
    });
  });


  describe('Edit expense', () => {
    it('should allow updating expense properties', () => {
      const expense = createTestExpenses()[0];
      const updated: Expense = {
        ...expense,
        description: 'Updated Dinner',
        amount: 400,
        category: 'entertainment',
      };

      expect(updated.description).toBe('Updated Dinner');
      expect(updated.amount).toBe(400);
      expect(updated.category).toBe('entertainment');
      expect(updated.id).toBe(expense.id); // ID should remain same
    });

    it('should allow updating split amounts', () => {
      const expense = createTestExpenses()[0];
      const updated: Expense = {
        ...expense,
        amount: 600,
        splits: {
          alice: 200,
          bob: 200,
          charlie: 200,
        },
      };

      expect(updated.amount).toBe(600);
      expect(updated.splits['alice']).toBe(200);
      expect(Object.values(updated.splits).reduce((a, b) => a + b, 0)).toBe(600);
    });

    it('should allow changing who paid', () => {
      const expense = createTestExpenses()[0];
      const updated: Expense = {
        ...expense,
        paidBy: 'bob',
      };

      expect(updated.paidBy).toBe('bob');
      expect(updated.paidBy).not.toBe(expense.paidBy);
    });
  });
});


  describe('Member operations', () => {
    it('should update member name', () => {
      const member = { id: 'alice', name: 'Alice', joinedAt: Date.now() };
      const updated = { ...member, name: 'Alicia' };

      expect(updated.name).toBe('Alicia');
      expect(updated.id).toBe('alice');
    });

    it('should remove member from expenses', () => {
      const expenses = createTestExpenses();
      const memberId = 'alice';

      // Filter expenses paid by member
      const expensesPaidByMember = expenses.filter(e => e.paidBy === memberId);
      expect(expensesPaidByMember.length).toBe(1);

      // Remove member from splits
      const updated = expenses.map(e => {
        const { [memberId]: _, ...rest } = e.splits;
        return { ...e, splits: rest };
      });

      // Verify member removed from all splits
      updated.forEach(exp => {
        expect(exp.splits[memberId]).toBeUndefined();
      });
    });

    it('should calculate total paid by member', () => {
      const expenses = createTestExpenses();
      const memberId = 'alice';

      const totalPaid = expenses
        .filter(e => e.paidBy === memberId)
        .reduce((sum, e) => sum + e.amount, 0);

      expect(totalPaid).toBe(300); // Alice paid for Dinner
    });

    it('should filter expenses by payer', () => {
      const expenses = createTestExpenses();
      const memberMap = new Map([
        ['alice', 'Alice'],
        ['bob', 'Bob'],
        ['charlie', 'Charlie'],
      ]);

      const filtered = expenses.filter(e => e.paidBy === 'bob');
      expect(filtered.length).toBe(1);
      expect(filtered[0].description).toBe('Breakfast');
      expect(memberMap.get(filtered[0].paidBy)).toBe('Bob');
    });
  });
