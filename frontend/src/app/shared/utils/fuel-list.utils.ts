import { toDateTimestamp } from './date.utils';
import { getFuelPricePerUnit } from './fuel-record.utils';

export type FuelSortOption =
  | 'newest'
  | 'oldest'
  | 'price-low-high'
  | 'price-high-low'
  | 'price-per-unit-low-high'
  | 'price-per-unit-high-low';

export interface FuelListRecord {
  id: number;
  date: string;
  mileage: number | null;
  cost: number | null;
  amount: number | null;
  gasStation: string | null;
  currency?: string;
}

export function filterFuelRecords<T extends FuelListRecord>(records: T[], query: string): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return records;
  }

  return records.filter((record) =>
    (record.gasStation ?? '').toLowerCase().includes(normalizedQuery)
  );
}

export function sortFuelRecords<T extends FuelListRecord>(records: T[], sort: FuelSortOption): T[] {
  const sorted = [...records];

  switch (sort) {
    case 'oldest':
      return sorted.sort((left, right) => toDateTimestamp(left.date) - toDateTimestamp(right.date));
    case 'price-low-high':
      return sorted.sort(
        (left, right) =>
          compareNullableNumbers(left.cost, right.cost, 'asc') || compareByNewest(left, right)
      );
    case 'price-high-low':
      return sorted.sort(
        (left, right) =>
          compareNullableNumbers(left.cost, right.cost, 'desc') || compareByNewest(left, right)
      );
    case 'price-per-unit-low-high':
      return sorted.sort(
        (left, right) =>
          compareNullableNumbers(getFuelPricePerUnit(left), getFuelPricePerUnit(right), 'asc') ||
          compareByNewest(left, right)
      );
    case 'price-per-unit-high-low':
      return sorted.sort(
        (left, right) =>
          compareNullableNumbers(getFuelPricePerUnit(left), getFuelPricePerUnit(right), 'desc') ||
          compareByNewest(left, right)
      );
    case 'newest':
    default:
      return sorted.sort(compareByNewest);
  }
}

function compareByNewest(left: FuelListRecord, right: FuelListRecord): number {
  return toDateTimestamp(right.date) - toDateTimestamp(left.date);
}

function compareNullableNumbers(
  left: number | null,
  right: number | null,
  direction: 'asc' | 'desc'
): number {
  if (left === null && right === null) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return direction === 'asc' ? left - right : right - left;
}
