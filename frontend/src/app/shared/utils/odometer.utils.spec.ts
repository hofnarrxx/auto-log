import { pickLatestOdometer } from './odometer.utils';

describe('pickLatestOdometer', () => {
  const earlier = { mileage: 20_000, date: '2026-02-01' };
  const later = { mileage: 21_000, date: '2026-03-01' };

  it('picks the reading with the more recent date, regardless of argument order', () => {
    expect(pickLatestOdometer(earlier, later)).toBe(later);
    expect(pickLatestOdometer(later, earlier)).toBe(later);
  });

  it('returns the non-null side when one side is absent', () => {
    expect(pickLatestOdometer(null, later)).toBe(later);
    expect(pickLatestOdometer(earlier, undefined)).toBe(earlier);
  });

  it('returns null when both sides are absent', () => {
    expect(pickLatestOdometer(null, undefined)).toBeNull();
    expect(pickLatestOdometer(undefined, null)).toBeNull();
  });
});
