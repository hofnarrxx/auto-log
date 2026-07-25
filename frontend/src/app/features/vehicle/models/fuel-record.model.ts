export interface FuelRecord {
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

export interface FuelRecordPayload {
  date: string;
  amount: number;
  cost: number;
  mileage: number;
  gasStation: string | null;
  currency: string;
}
