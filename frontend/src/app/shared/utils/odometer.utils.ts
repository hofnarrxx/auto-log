import { toDateTimestamp } from './date.utils';

/**
 * Structural (not imported) shape of the backend's `LatestOdometerResponse` — kept duck-typed so
 * this file can stay under `shared/` without depending on `features/vehicle/models`.
 */
export interface OdometerReading {
  mileage: number;
  date: string;
}

/**
 * Picks the more recent of two "latest odometer" readings (e.g. one from the fuel summary, one
 * from the maintenance summary), by date. Either side may be absent.
 */
export function pickLatestOdometer<T extends OdometerReading>(
  first: T | null | undefined,
  second: T | null | undefined
): T | null {
  if (!first) {
    return second ?? null;
  }

  if (!second) {
    return first;
  }

  return toDateTimestamp(second.date) > toDateTimestamp(first.date) ? second : first;
}
