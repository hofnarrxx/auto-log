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
      return sorted.sort((left, right) => toTimestamp(left.date) - toTimestamp(right.date));
    case 'price-low-high':
      return sorted.sort(
        (left, right) =>
          compareNullableNumbers(left.cost, right.cost, 'asc') ||
          toTimestamp(right.date) - toTimestamp(left.date)
      );
    case 'price-high-low':
      return sorted.sort(
        (left, right) =>
          compareNullableNumbers(left.cost, right.cost, 'desc') ||
          toTimestamp(right.date) - toTimestamp(left.date)
      );
    case 'price-per-unit-low-high':
      return sorted.sort(
        (left, right) =>
          compareNullableNumbers(pricePerUnit(left), pricePerUnit(right), 'asc') ||
          toTimestamp(right.date) - toTimestamp(left.date)
      );
    case 'price-per-unit-high-low':
      return sorted.sort(
        (left, right) =>
          compareNullableNumbers(pricePerUnit(left), pricePerUnit(right), 'desc') ||
          toTimestamp(right.date) - toTimestamp(left.date)
      );
    case 'newest':
    default:
      return sorted.sort((left, right) => toTimestamp(right.date) - toTimestamp(left.date));
  }
}

export function findMileageWarningRecordIds<T extends { id: number; mileage: number | null }>(
  records: T[],
  getDate: (record: T) => string
): Set<number> {
  const sorted = [...records].sort(
    (left, right) => toTimestamp(getDate(left)) - toTimestamp(getDate(right))
  );

  const warnings = new Set<number>();
  let maxMileageSeen: number | null = null;

  sorted.forEach((record) => {
    const mileage = record.mileage;
    if (mileage === null) {
      return;
    }

    if (maxMileageSeen !== null && mileage < maxMileageSeen) {
      warnings.add(record.id);
      return;
    }

    maxMileageSeen = maxMileageSeen === null ? mileage : Math.max(maxMileageSeen, mileage);
  });

  return warnings;
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

function pricePerUnit(record: FuelListRecord): number | null {
  if (record.cost === null || record.amount === null || record.amount <= 0) {
    return null;
  }

  return record.cost / record.amount;
}

function toTimestamp(date: string): number {
  const timestamp = new Date(`${date}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
