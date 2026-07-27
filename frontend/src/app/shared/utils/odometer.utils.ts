import { toDateTimestamp } from './date.utils';

/**
 * Any record that can carry an odometer reading. Fuel records date themselves with `date`,
 * maintenance records with `serviceDate`.
 */
export interface OdometerRecord {
  mileage: number | null;
  date?: string;
  serviceDate?: string;
}

export function getOdometerRecordDate(record: OdometerRecord): string {
  return record.date ?? record.serviceDate ?? '';
}

/**
 * Most recent record that actually carries a mileage reading, or `null` when there is none.
 */
export function getLatestOdometerRecord<T extends OdometerRecord>(records: readonly T[]): T | null {
  const recordsWithMileage = records.filter((record) => record.mileage !== null);

  if (!recordsWithMileage.length) {
    return null;
  }

  return recordsWithMileage.sort(
    (left, right) =>
      toDateTimestamp(getOdometerRecordDate(right)) - toDateTimestamp(getOdometerRecordDate(left))
  )[0];
}

/**
 * Latest recorded mileage, falling back to the vehicle's own mileage when no record has one.
 */
export function getLatestOdometerMileage(
  records: readonly OdometerRecord[],
  fallbackMileage: number | null | undefined
): number | null {
  const latest = getLatestOdometerRecord(records);

  if (latest !== null && latest.mileage !== null && latest.mileage !== undefined) {
    return latest.mileage;
  }

  return fallbackMileage === null || fallbackMileage === undefined
    ? null
    : Math.trunc(fallbackMileage);
}
