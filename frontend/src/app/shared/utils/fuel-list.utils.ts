export type FuelSortOption =
  | 'newest'
  | 'oldest'
  | 'price-low-high'
  | 'price-high-low'
  | 'price-per-unit-low-high'
  | 'price-per-unit-high-low';

export interface FuelListRecord {
  id: number;
  date: string;
  mileage: number | null;
  cost: number | null;
  amount: number | null;
  gasStation: string | null;
  currency?: string;
}
