export const FUEL_TYPES: readonly string[] = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'LPG'];

const FUEL_TYPE_LABEL_KEYS: Readonly<Record<string, string>> = {
  petrol: 'vehicle.form.fuelTypes.petrol',
  diesel: 'vehicle.form.fuelTypes.diesel',
  hybrid: 'vehicle.form.fuelTypes.hybrid',
  electric: 'vehicle.form.fuelTypes.electric',
  lpg: 'vehicle.form.fuelTypes.lpg',
};

const ELECTRIC_FUEL_TYPE = 'electric';
const ELECTRIC_UNIT = 'kWh';
const DEFAULT_UNIT = 'L';

/**
 * Whether the given vehicle fuel type is electric (case/whitespace-insensitive), used to decide
 * between energy (kWh) and volume (L) units across fuel entries and consumption stats.
 */
export function isElectricFuelType(fuelType: string | null | undefined): boolean {
  return (fuelType ?? '').trim().toLowerCase() === ELECTRIC_FUEL_TYPE;
}

/**
 * Unit to display for fuel amounts/consumption for a given vehicle fuel type: `kWh` for
 * electric vehicles, `L` otherwise.
 */
export function getFuelUnit(fuelType: string | null | undefined): string {
  return isElectricFuelType(fuelType) ? ELECTRIC_UNIT : DEFAULT_UNIT;
}

/**
 * Translation key for a stored fuel type, or `null` for values outside {@link FUEL_TYPES}
 * so callers can decide their own fallback.
 */
export function getFuelTypeLabelKey(fuelType: string | null | undefined): string | null {
  const normalized = (fuelType ?? '').trim().toLowerCase();
  return FUEL_TYPE_LABEL_KEYS[normalized] ?? null;
}
