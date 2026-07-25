import {
  filterFuelRecords,
  findMileageWarningRecordIds,
  FuelListRecord,
  sortFuelRecords,
} from './fuel-list.utils';

const records: FuelListRecord[] = [
  {
    id: 1,
    date: '2026-01-01',
    mileage: 10_000,
    cost: 60,
    amount: 30,
    gasStation: 'North Fuel',
    currency: 'EUR',
  },
  {
    id: 2,
    date: '2026-02-01',
    mileage: 10_500,
    cost: 45,
    amount: 15,
    gasStation: 'City Station',
    currency: 'EUR',
  },
  {
    id: 3,
    date: '2026-03-01',
    mileage: 10_400,
    cost: null,
    amount: null,
    gasStation: null,
    currency: 'EUR',
  },
];

describe('fuel-list utilities', () => {
  describe('filterFuelRecords', () => {
    it('matches gas stations case-insensitively and ignores surrounding whitespace', () => {
      expect(filterFuelRecords(records, '  city ')).toEqual([records[1]]);
    });

    it('returns all records when the query is empty', () => {
      expect(filterFuelRecords(records, '   ')).toBe(records);
    });
  });

  describe('sortFuelRecords', () => {
    it('sorts newest records first without mutating the input', () => {
      const input = [...records];

      expect(sortFuelRecords(input, 'newest').map((record) => record.id)).toEqual([3, 2, 1]);
      expect(input).toEqual(records);
    });

    it('sorts null prices after numeric prices', () => {
      expect(sortFuelRecords(records, 'price-low-high').map((record) => record.id)).toEqual([
        2, 1, 3,
      ]);
    });

    it('sorts by price per unit', () => {
      expect(
        sortFuelRecords(records, 'price-per-unit-high-low').map((record) => record.id)
      ).toEqual([2, 1, 3]);
    });
  });

  describe('findMileageWarningRecordIds', () => {
    it('flags a later record whose mileage decreases', () => {
      const warnings = findMileageWarningRecordIds(records, (record) => record.date);

      expect([...warnings]).toEqual([3]);
    });

    it('ignores records without mileage', () => {
      const withoutMileage = records.map((record) => ({ ...record, mileage: null }));

      expect(findMileageWarningRecordIds(withoutMileage, (record) => record.date).size).toBe(0);
    });
  });
});
