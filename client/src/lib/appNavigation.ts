export const appCategories = {
  trips: { id: 'trips', path: '/trips', detailPath: (id: string) => `/trip/${id}` },
  sharedHomes: { id: 'shared-homes', path: '/shared-homes', detailPath: (id: string) => `/shared-home/${id}` },
  groupFunds: { id: 'group-funds', path: '/group-funds', detailPath: (id: string) => `/group-fund/${id}` },
} as const;

export const landingCategoryOrder = ['trips', 'shared-homes', 'group-funds'] as const;

export function categoryListPath(category: (typeof landingCategoryOrder)[number]): string {
  return category === 'trips' ? appCategories.trips.path : category === 'shared-homes' ? appCategories.sharedHomes.path : appCategories.groupFunds.path;
}
