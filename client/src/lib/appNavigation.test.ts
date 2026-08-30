import { describe, expect, it } from 'vitest';
import { appCategories, categoryListPath, landingCategoryOrder } from './appNavigation';

describe('Kharcha landing navigation', () => {
  it('keeps the landing hierarchy in Trips, Shared Homes, Group Funds, and Personal Budget order', () => {
    expect(landingCategoryOrder).toEqual(['trips', 'shared-homes', 'group-funds', 'personal-budget']);
    expect(categoryListPath('trips')).toBe('/trips');
    expect(categoryListPath('shared-homes')).toBe('/shared-homes');
  });

  it('keeps category lists and detail routes separated', () => {
    expect(appCategories.trips.path).not.toBe(appCategories.sharedHomes.path);
    expect(appCategories.trips.path).not.toBe(appCategories.groupFunds.path);
    expect(appCategories.trips.detailPath('trip-1')).toBe('/trip/trip-1');
    expect(appCategories.sharedHomes.detailPath('home-1')).toBe('/shared-home/home-1');
    expect(appCategories.groupFunds.detailPath('fund-1')).toBe('/group-fund/fund-1');
    expect(appCategories.trips.detailPath('home-1')).not.toBe(appCategories.sharedHomes.detailPath('home-1'));
  });
});
