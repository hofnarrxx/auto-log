import { findMileageWarningRecordIds } from './mileage.utils';

interface TestRecord {
  id: number;
  date: string;
  mileage: number | null;
}

const getDate = (record: TestRecord) => record.date;

describe('findMileageWarningRecordIds', () => {
  it('flags a later record whose mileage decreases', () => {
    const records: TestRecord[] = [
      { id: 1, date: '2026-01-01', mileage: 10_000 },
      { id: 2, date: '2026-02-01', mileage: 10_500 },
      { id: 3, date: '2026-03-01', mileage: 10_400 },
    ];

    expect([...findMileageWarningRecordIds(records, getDate)]).toEqual([3]);
  });

  it('compares by date rather than input order', () => {
    const records: TestRecord[] = [
      { id: 3, date: '2026-03-01', mileage: 10_400 },
      { id: 1, date: '2026-01-01', mileage: 10_000 },
      { id: 2, date: '2026-02-01', mileage: 10_500 },
    ];

    expect([...findMileageWarningRecordIds(records, getDate)]).toEqual([3]);
  });

  it('ignores records without a mileage reading', () => {
    const records: TestRecord[] = [
      { id: 1, date: '2026-01-01', mileage: 10_500 },
      { id: 2, date: '2026-02-01', mileage: null },
      { id: 3, date: '2026-03-01', mileage: 10_600 },
    ];

    expect(findMileageWarningRecordIds(records, getDate).size).toBe(0);
  });

  it('keeps the highest mileage seen so far as the baseline', () => {
    const records: TestRecord[] = [
      { id: 1, date: '2026-01-01', mileage: 10_000 },
      { id: 2, date: '2026-02-01', mileage: 9_000 },
      { id: 3, date: '2026-03-01', mileage: 9_500 },
    ];

    expect([...findMileageWarningRecordIds(records, getDate)]).toEqual([2, 3]);
  });

  it('treats records with unparseable dates as the earliest', () => {
    const records: TestRecord[] = [
      { id: 1, date: 'not-a-date', mileage: 10_000 },
      { id: 2, date: '2026-01-01', mileage: 9_000 },
    ];

    expect([...findMileageWarningRecordIds(records, getDate)]).toEqual([2]);
  });

  it('returns no warnings for an empty list', () => {
    expect(findMileageWarningRecordIds([], getDate).size).toBe(0);
  });

  it('leaves the input list order untouched', () => {
    const records: TestRecord[] = [
      { id: 2, date: '2026-02-01', mileage: 10_500 },
      { id: 1, date: '2026-01-01', mileage: 10_000 },
    ];

    findMileageWarningRecordIds(records, getDate);

    expect(records.map((record) => record.id)).toEqual([2, 1]);
  });
});
