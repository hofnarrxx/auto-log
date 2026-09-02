import { formatCurrencyTotals } from './currency-totals.utils';

describe('formatCurrencyTotals', () => {
  const format = (value: number, currency: string) => `${value} ${currency}`;

  it('returns an empty string for null or undefined totals', () => {
    expect(formatCurrencyTotals(null, format)).toBe('');
    expect(formatCurrencyTotals(undefined, format)).toBe('');
  });

  it('returns an empty string for an empty map', () => {
    expect(formatCurrencyTotals({}, format)).toBe('');
  });

  it('formats and joins totals sorted by currency code', () => {
    expect(formatCurrencyTotals({ USD: 50, EUR: 100 }, format)).toBe('100 EUR | 50 USD');
  });
});
