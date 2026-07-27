export const FUEL_TYPES: readonly string[] = [
  'Petrol',
  'Diesel',
  'Hybrid',
  'Electric',
  'LPG',
  'CNG',
];

const FUEL_TYPE_LABEL_KEYS: Readonly<Record<string, string>> = {
  petrol: 'vehicle.form.fuelTypes.petrol',
  diesel: 'vehicle.form.fuelTypes.diesel',
  hybrid: 'vehicle.form.fuelTypes.hybrid',
  electric: 'vehicle.form.fuelTypes.electric',
  lpg: 'vehicle.form.fuelTypes.lpg',
  cng: 'vehicle.form.fuelTypes.cng',
};

/**
 * Translation key for a stored fuel type, or `null` for values outside {@link FUEL_TYPES}
 * so callers can decide their own fallback.
 */
export function getFuelTypeLabelKey(fuelType: string | null | undefined): string | null {
  const normalized = (fuelType ?? '').trim().toLowerCase();
  return FUEL_TYPE_LABEL_KEYS[normalized] ?? null;
}
