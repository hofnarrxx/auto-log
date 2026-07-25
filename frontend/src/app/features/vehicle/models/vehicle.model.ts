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
