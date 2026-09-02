/**
 * Formats a per-currency total map (as returned by the fuel/maintenance summary endpoints) into
 * a single "123 EUR | 45 USD" readout, sorted by currency code.
 */
export function formatCurrencyTotals(
  totals: Record<string, number> | null | undefined,
  formatCurrency: (value: number, currency: string) => string
): string {
  if (!totals) {
    return '';
  }

  return Object.entries(totals)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([currency, total]) => formatCurrency(total, currency))
    .join(' | ');
}
