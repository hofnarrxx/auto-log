export interface SharedFuelEntry {
  id: number;
  vehicleId: number;
  date: string;
  mileage: number | null;
  cost: number | null;
  amount: number | null;
  gasStation: string | null;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SharedMaintenanceEntry {
  id: number;
  vehicleId: number;
  serviceDate: string;
  title: string | null;
  mileage: number | null;
  category: string;
  description: string;
  cost: number | null;
  currency?: string;
  attachments?: SharedMaintenanceAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface SharedMaintenanceAttachment {
  id: number;
  fileName: string;
  contentType: string | null;
  sizeBytes: number | null;
  url: string | null;
  createdAt: string;
}

export interface SharedVehicleResponse {
  carId: number;
  brand: string;
  model: string;
  fuelType: string | null;
  mileage: number | null;
  year: number | null;
  fuelEntries: SharedFuelEntry[];
  maintenanceEntries: SharedMaintenanceEntry[];
}
