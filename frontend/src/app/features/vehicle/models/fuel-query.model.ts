import type { FuelSortOption } from '../../../shared/utils/fuel-list.utils';

export type { FuelSortOption };

/**
 * Server-side query for the paged fuel list. `sort` values are the same kebab-case wire strings
 * the backend's `FuelSort.fromParam` accepts.
 */
export interface FuelQuery {
  page: number;
  size: number;
  sort: FuelSortOption;
  gasStation: string;
}

export const DEFAULT_FUEL_PAGE_SIZE = 20;

export const DEFAULT_FUEL_QUERY: FuelQuery = {
  page: 0,
  size: DEFAULT_FUEL_PAGE_SIZE,
  sort: 'newest',
  gasStation: '',
};
