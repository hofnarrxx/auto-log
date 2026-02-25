export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number | null;
  mileage: number | null;
  image?: string;
}