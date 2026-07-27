export interface FuelPricingRecord {
  cost: number | null;
  amount: number | null;
}

/**
 * Cost of a single fuel unit, or `null` when the record cannot produce a meaningful price.
 */
export function getFuelPricePerUnit(record: FuelPricingRecord): number | null {
  if (record.cost === null || record.amount === null || record.amount <= 0) {
    return null;
  }

  return record.cost / record.amount;
}

export function formatFuelAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '-';
  }

  return `${amount.toFixed(2)} L`;
}
