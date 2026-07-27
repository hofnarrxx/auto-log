import { formatFuelAmount, getFuelPricePerUnit } from './fuel-record.utils';

describe('fuel record utilities', () => {
  describe('getFuelPricePerUnit', () => {
    it('divides cost by amount', () => {
      expect(getFuelPricePerUnit({ cost: 60, amount: 30 })).toBe(2);
    });

    it('returns null when either value is missing', () => {
      expect(getFuelPricePerUnit({ cost: null, amount: 30 })).toBeNull();
      expect(getFuelPricePerUnit({ cost: 60, amount: null })).toBeNull();
    });

    it('returns null rather than dividing by a non-positive amount', () => {
      expect(getFuelPricePerUnit({ cost: 60, amount: 0 })).toBeNull();
      expect(getFuelPricePerUnit({ cost: 60, amount: -5 })).toBeNull();
    });

    it('treats a zero cost as a real price', () => {
      expect(getFuelPricePerUnit({ cost: 0, amount: 30 })).toBe(0);
    });
  });

  describe('formatFuelAmount', () => {
    it('renders litres with two decimals', () => {
      expect(formatFuelAmount(30)).toBe('30.00 L');
      expect(formatFuelAmount(12.345)).toBe('12.35 L');
    });

    it('renders a dash when the amount is missing', () => {
      expect(formatFuelAmount(null)).toBe('-');
      expect(formatFuelAmount(undefined)).toBe('-');
    });

    it('renders a zero amount instead of a dash', () => {
      expect(formatFuelAmount(0)).toBe('0.00 L');
    });
  });
});
