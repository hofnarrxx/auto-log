import type { LatestOdometer } from './latest-odometer.model';

/**
 * Mirrors the backend's `MaintenanceSummaryResponse`, computed server-side over the whole
 * maintenance record set for a vehicle (not just the current page). Field names match the JSON
 * payload exactly, including `latestOdometer` (the fuel summary calls the equivalent field
 * `latestOdometerRecord`).
 */
export interface MaintenanceSummary {
  totalRecords: number;
  totalCostByCurrency: Record<string, number>;
  latestOdometer: LatestOdometer | null;
  mileageWarningRecordIds: number[];
  maxCost: number;
}
