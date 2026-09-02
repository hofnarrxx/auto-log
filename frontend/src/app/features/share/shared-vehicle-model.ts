import type { FuelSummary, MaintenanceSummary } from '../vehicle/models';

/**
 * Mirrors the backend's `PublicVehicleAccessResponse`. Unlike the plan's original assumption,
 * this endpoint returns only vehicle info plus server-computed summaries; fuel and maintenance
 * records are fetched separately (paged) via `PublicShareApi.getFuelPage`/`getMaintenancePage`.
 */
export interface SharedVehicleResponse {
  carId: number;
  brand: string;
  model: string;
  fuelType: string | null;
  mileage: number | null;
  year: number | null;
  fuelSummary: FuelSummary;
  maintenanceSummary: MaintenanceSummary;
}
