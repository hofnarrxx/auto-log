import type { CreateVehicleCommand, UpdateVehicleCommand } from '../models';

/**
 * Raw value of the vehicle form. Required fields stay nullable here because an untouched numeric
 * or select control holds `null` until the user picks something.
 */
export interface VehicleFormValue {
  make: string;
  model: string;
  year: number | null;
  mileage: number | null;
  fuelType: string | null;
  licensePlate: string | null;
}

/**
 * Returns `null` when a required field is still empty, so callers never build a partial payload.
 */
export function toCreateVehicleCommand(
  value: VehicleFormValue,
  imageKey: string | null
): CreateVehicleCommand | null {
  const { make, model, year, mileage, fuelType, licensePlate } = value;

  if (year === null || mileage === null || !fuelType) {
    return null;
  }

  return { make, model, year, mileage, fuelType, licensePlate, imageKey };
}

export function toUpdateVehicleCommand(
  id: string,
  value: VehicleFormValue,
  imageKey: string | null
): UpdateVehicleCommand | null {
  const command = toCreateVehicleCommand(value, imageKey);
  return command === null ? null : { id, ...command };
}
