import {
  getAverageFuelConsumptionPer100Km,
  type FuelConsumptionRecord,
} from './vehicle-statistics';

describe('getAverageFuelConsumptionPer100Km', () => {
  it('measures consumption across the distance between refuellings', () => {
    const records: FuelConsumptionRecord[] = [
      { date: '2026-01-01', mileage: 10_000, amount: 40 },
      { date: '2026-02-01', mileage: 10_500, amount: 30 },
    ];

    expect(getAverageFuelConsumptionPer100Km(records)).toBe(6);
  });

  it('ignores the input order', () => {
    const records: FuelConsumptionRecord[] = [
      { date: '2026-02-01', mileage: 10_500, amount: 30 },
      { date: '2026-01-01', mileage: 10_000, amount: 40 },
    ];

    expect(getAverageFuelConsumptionPer100Km(records)).toBe(6);
  });

  it('skips records without a mileage or amount', () => {
    const records: FuelConsumptionRecord[] = [
      { date: '2026-01-01', mileage: 10_000, amount: 40 },
      { date: '2026-01-15', mileage: null, amount: 25 },
      { date: '2026-01-20', mileage: 10_200, amount: null },
      { date: '2026-02-01', mileage: 10_500, amount: 30 },
    ];

    expect(getAverageFuelConsumptionPer100Km(records)).toBe(6);
  });

  it('needs at least two usable records', () => {
    expect(getAverageFuelConsumptionPer100Km([])).toBeNull();
    expect(
      getAverageFuelConsumptionPer100Km([{ date: '2026-01-01', mileage: 10_000, amount: 40 }])
    ).toBeNull();
  });

  it('returns null when the odometer only decreases', () => {
    const records: FuelConsumptionRecord[] = [
      { date: '2026-01-01', mileage: 10_500, amount: 40 },
      { date: '2026-02-01', mileage: 10_000, amount: 30 },
    ];

    expect(getAverageFuelConsumptionPer100Km(records)).toBeNull();
  });

  it('excludes intervals where the odometer went backwards', () => {
    const records: FuelConsumptionRecord[] = [
      { date: '2026-01-01', mileage: 10_000, amount: 40 },
      { date: '2026-02-01', mileage: 9_000, amount: 99 },
      { date: '2026-03-01', mileage: 10_500, amount: 30 },
    ];

    expect(getAverageFuelConsumptionPer100Km(records)).toBe(2);
  });
});
