import type { MaintenanceSortOption } from '../../../shared/utils/maintenance-list.utils';

export type { MaintenanceSortOption };

/**
 * Server-side query for the paged maintenance list. `categories` follows the backend's
 * `categoriesCsv` semantics: `undefined` means "no filter" (all categories), an empty array
 * means "filter to nothing" (the user unchecked every category), and a populated array is sent
 * as a comma-separated list of category display names.
 */
export interface MaintenanceQuery {
  page: number;
  size: number;
  sort: MaintenanceSortOption;
  title: string;
  categories: string[] | undefined;
  currency: string;
  minCost: number | null;
  maxCost: number | null;
}

export const DEFAULT_MAINTENANCE_PAGE_SIZE = 20;

export const ALL_CURRENCIES = '';

export const DEFAULT_MAINTENANCE_QUERY: MaintenanceQuery = {
  page: 0,
  size: DEFAULT_MAINTENANCE_PAGE_SIZE,
  sort: 'newest',
  title: '',
  categories: undefined,
  currency: ALL_CURRENCIES,
  minCost: null,
  maxCost: null,
};
