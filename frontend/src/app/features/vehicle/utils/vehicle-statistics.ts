import { toDateTimestamp } from '../../../shared/utils/date.utils';

export interface FuelConsumptionRecord {
  date: string;
  mileage: number | null;
  amount: number | null;
}

/**
 * Average consumption in litres per 100 km, measured across the distance between consecutive
 * refuellings. Returns `null` when the records cannot describe a distance, for example when
 * fewer than two of them carry both a mileage and an amount, or when the odometer only ever
 * goes backwards.
 */
export function getAverageFuelConsumptionPer100Km(
  records: readonly FuelConsumptionRecord[]
): number | null {
  const usableRecords = records
    .filter((record) => record.mileage !== null && record.amount !== null && record.amount > 0)
    .sort((left, right) => toDateTimestamp(left.date) - toDateTimestamp(right.date));

  if (usableRecords.length < 2) {
    return null;
  }

  let totalKm = 0;
  let totalLitres = 0;

  for (let index = 1; index < usableRecords.length; index++) {
    const previous = usableRecords[index - 1];
    const current = usableRecords[index];

    if (previous.mileage === null || current.mileage === null || current.amount === null) {
      continue;
    }

    const distance = current.mileage - previous.mileage;
    if (distance <= 0) {
      continue;
    }

    totalKm += distance;
    totalLitres += current.amount;
  }

  if (totalKm <= 0 || totalLitres <= 0) {
    return null;
  }

  return (totalLitres / totalKm) * 100;
}
