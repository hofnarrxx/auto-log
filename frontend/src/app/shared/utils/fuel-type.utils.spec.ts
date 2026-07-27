import { FUEL_TYPES, getFuelTypeLabelKey } from './fuel-type.utils';

describe('getFuelTypeLabelKey', () => {
  it('maps every offered fuel type to a translation key', () => {
    FUEL_TYPES.forEach((fuelType) => {
      expect(getFuelTypeLabelKey(fuelType)).toBe(
        `vehicle.form.fuelTypes.${fuelType.toLowerCase()}`
      );
    });
  });

  it('ignores casing and surrounding whitespace', () => {
    expect(getFuelTypeLabelKey('  DIESEL ')).toBe('vehicle.form.fuelTypes.diesel');
  });

  it('returns null for values it does not know', () => {
    expect(getFuelTypeLabelKey('Hydrogen')).toBeNull();
    expect(getFuelTypeLabelKey('')).toBeNull();
    expect(getFuelTypeLabelKey(null)).toBeNull();
    expect(getFuelTypeLabelKey(undefined)).toBeNull();
  });
});
