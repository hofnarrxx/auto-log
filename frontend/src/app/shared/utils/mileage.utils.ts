import { toDateTimestamp } from './date.utils';

export interface MileageRecord {
  id: number;
  mileage: number | null;
}

/**
 * Finds records whose mileage is lower than the highest mileage recorded before them,
 * which usually means the odometer value was mistyped.
 */
export function findMileageWarningRecordIds<T extends MileageRecord>(
  records: readonly T[],
  getDate: (record: T) => string
): Set<number> {
  const sorted = [...records].sort(
    (left, right) => toDateTimestamp(getDate(left)) - toDateTimestamp(getDate(right))
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
