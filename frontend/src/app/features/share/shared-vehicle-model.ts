import type { FuelRecord, MaintenanceRecord } from '../vehicle/models';

export interface SharedVehicleResponse {
  carId: number;
  brand: string;
  model: string;
  fuelType: string | null;
  mileage: number | null;
  year: number | null;
  fuelEntries: FuelRecord[];
  maintenanceEntries: MaintenanceRecord[];
}
