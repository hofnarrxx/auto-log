import { toDateTimestamp } from './date.utils';

describe('toDateTimestamp', () => {
  it('parses an ISO date at local midnight', () => {
    expect(toDateTimestamp('2026-03-04')).toBe(new Date(2026, 2, 4).getTime());
  });

  it('orders dates chronologically', () => {
    expect(toDateTimestamp('2026-01-01')).toBeLessThan(toDateTimestamp('2026-01-02'));
  });

  it('returns zero for values it cannot parse', () => {
    expect(toDateTimestamp('not-a-date')).toBe(0);
    expect(toDateTimestamp('')).toBe(0);
    expect(toDateTimestamp(null)).toBe(0);
    expect(toDateTimestamp(undefined)).toBe(0);
  });
});
