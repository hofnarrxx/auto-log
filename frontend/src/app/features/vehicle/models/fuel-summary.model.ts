import type { LatestOdometer } from './latest-odometer.model';

/**
 * Mirrors the backend's `FuelSummaryResponse`, computed server-side over the whole fuel record
 * set for a vehicle (not just the current page). Field names match the JSON payload exactly.
 */
export interface FuelSummary {
  totalRecords: number;
  totalCostByCurrency: Record<string, number>;
  latestOdometerRecord: LatestOdometer | null;
  mileageWarningRecordIds: number[];
  averageConsumptionPer100km: number | null;
}
