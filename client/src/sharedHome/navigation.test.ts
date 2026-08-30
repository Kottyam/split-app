import { describe, expect, it } from 'vitest';
import { primaryTabs } from '@/pages/SharedHomeDetail';

describe('Shared Home navigation structure', () => {
  it('keeps the six simplified sections in the required primary order', () => {
    expect(primaryTabs.map(tab => tab.id)).toEqual(['overview', 'expenses', 'recurring', 'members', 'settlements', 'reports']);
  });

  it('uses localized-friendly section labels without legacy management tabs', () => {
    expect(primaryTabs.map(tab => tab.label)).toEqual(['Overview', 'Expenses', 'Recurring', 'Members', 'Settlements', 'Report']);
    expect(primaryTabs.map(tab => tab.id)).not.toContain('rent');
    expect(primaryTabs.map(tab => tab.id)).not.toContain('bills');
    expect(primaryTabs.map(tab => tab.id)).not.toContain('groceries');
    expect(primaryTabs.map(tab => tab.id)).not.toContain('rooms');
  });

  it('starts Shared Home on Overview', () => {
    expect(primaryTabs[0]?.id).toBe('overview');
  });
});
