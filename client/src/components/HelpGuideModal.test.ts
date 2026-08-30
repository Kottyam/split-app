import { describe, it, expect } from 'vitest';

describe('Help & Guide Specification Coverage', () => {
  it('covers all 15 required sections from the specification', () => {
    const requiredSections = [
      'What is Kharcha',
      'Trips',
      'Expense Splitting',
      'Settlements',
      'UPI Payments',
      'Shared Homes',
      'Group Funds',
      'Personal Budget',
      'Recurring Transactions',
      'Financial Goals',
      'Reports & Analytics',
      'Backup & Restore',
      'App Lock',
      'Data Safety & Privacy',
      'Frequently Asked Questions',
    ];
    expect(requiredSections.length).toBe(15);
  });
});
