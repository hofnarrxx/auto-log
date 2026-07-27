export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number | null;
  fuelType: string | null;
  mileage: number | null;
  licensePlate?: string | null;
  imageKey?: string | null;
  imageUrl?: string | null;
}

/**
 * Fields the API requires to create a vehicle. Unlike {@link Vehicle}, every value a user must
 * supply is non-nullable, so a partially filled form cannot be sent by accident.
 */
export interface CreateVehicleCommand {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  licensePlate: string | null;
  imageKey: string | null;
}

export interface UpdateVehicleCommand extends CreateVehicleCommand {
  id: number;
}
