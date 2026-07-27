import { toDateTimestamp } from './date.utils';

export type MaintenanceSortOption = 'newest' | 'oldest' | 'price-low-high' | 'price-high-low';

export interface MaintenanceListRecord {
  id: number;
  serviceDate: string;
  title?: string | null;
  mileage: number | null;
  category: string;
  cost: number | null;
  currency?: string;
}

export interface MaintenanceFilterState {
  selectedCategories: string[];
  selectedCurrencyFilter: string;
  minPriceLimit: number;
  maxPriceLimit: number;
  selectedSort: MaintenanceSortOption;
  titleSearch: string;
}

export function getMaintenanceCategoryLabel(category: string): string {
  switch (category.trim().toLowerCase()) {
    case 'inspection':
      return 'vehicle.maintenanceTab.categories.inspection';
    case 'oil change':
      return 'vehicle.maintenanceTab.categories.oilChange';
    case 'repair':
      return 'vehicle.maintenanceTab.categories.repair';
    case 'part replacement':
      return 'vehicle.maintenanceTab.categories.partReplacement';
    case 'fluid refill':
      return 'vehicle.maintenanceTab.categories.fluidRefill';
    case 'tires & wheels':
      return 'vehicle.maintenanceTab.categories.tiresAndWheels';
    case 'cosmetic':
      return 'vehicle.maintenanceTab.categories.cosmetic';
    default:
      return category;
  }
}

export function getMaintenanceCategoryIcon(category: string): string {
  const normalizedCategory = category.trim().toLowerCase();
  const iconMap: Record<string, string> = {
    inspection: 'search',
    'oil change': 'droplet',
    repair: 'wrench',
    'part replacement': 'cog',
    'fluid refill': 'droplets',
    'tires & wheels': 'disc',
    cosmetic: 'sparkles',
  };

  return iconMap[normalizedCategory] ?? 'tool-case';
}

export function getMaintenanceTimelineEntries<T extends MaintenanceListRecord>(
  records: T[],
  filters: MaintenanceFilterState,
  getRecordCurrency: (record: T) => string
): T[] {
  return [...records]
    .filter((record) => matchesMaintenanceCategoryFilter(record, filters.selectedCategories))
    .filter((record) => matchesMaintenancePriceFilter(record, filters, getRecordCurrency))
    .filter((record) => matchesMaintenanceTitleFilter(record, filters.titleSearch))
    .sort((left, right) => compareMaintenanceRecords(left, right, filters.selectedSort));
}

function matchesMaintenanceCategoryFilter<T extends MaintenanceListRecord>(
  record: T,
  selectedCategories: string[]
): boolean {
  if (!selectedCategories.length) {
    return false;
  }

  return selectedCategories.includes(record.category);
}

function matchesMaintenancePriceFilter<T extends MaintenanceListRecord>(
  record: T,
  filters: MaintenanceFilterState,
  getRecordCurrency: (record: T) => string
): boolean {
  const selectedCurrency = filters.selectedCurrencyFilter;
  const recordCurrency = getRecordCurrency(record);

  if (selectedCurrency !== 'All' && recordCurrency !== selectedCurrency) {
    return false;
  }

  if (record.cost === null) {
    return selectedCurrency === 'All';
  }

  return record.cost >= filters.minPriceLimit && record.cost <= filters.maxPriceLimit;
}

function matchesMaintenanceTitleFilter<T extends MaintenanceListRecord>(
  record: T,
  titleSearch: string
): boolean {
  const query = titleSearch.trim().toLowerCase();
  if (!query) {
    return true;
  }

  const title = (record.title ?? '').toLowerCase();
  return title.includes(query);
}

function compareMaintenanceRecords<T extends MaintenanceListRecord>(
  left: T,
  right: T,
  sort: MaintenanceSortOption
): number {
  if (sort === 'oldest') {
    return toDateTimestamp(left.serviceDate) - toDateTimestamp(right.serviceDate);
  }

  if (sort === 'price-low-high') {
    return compareMaintenancePrice(left, right, 'asc');
  }

  if (sort === 'price-high-low') {
    return compareMaintenancePrice(left, right, 'desc');
  }

  return toDateTimestamp(right.serviceDate) - toDateTimestamp(left.serviceDate);
}

function compareMaintenancePrice<T extends MaintenanceListRecord>(
  left: T,
  right: T,
  direction: 'asc' | 'desc'
): number {
  const leftValue = left.cost ?? Number.POSITIVE_INFINITY;
  const rightValue = right.cost ?? Number.POSITIVE_INFINITY;

  if (leftValue !== rightValue) {
    return direction === 'asc' ? leftValue - rightValue : rightValue - leftValue;
  }

  return toDateTimestamp(right.serviceDate) - toDateTimestamp(left.serviceDate);
}
