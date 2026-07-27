import {
  getLatestOdometerMileage,
  getLatestOdometerRecord,
  getOdometerRecordDate,
  type OdometerRecord,
} from './odometer.utils';

const fuelRecord: OdometerRecord = { date: '2026-02-01', mileage: 20_000 };
const maintenanceRecord: OdometerRecord = { serviceDate: '2026-03-01', mileage: 21_000 };

describe('odometer utilities', () => {
  describe('getOdometerRecordDate', () => {
    it('reads the date of fuel and maintenance records alike', () => {
      expect(getOdometerRecordDate(fuelRecord)).toBe('2026-02-01');
      expect(getOdometerRecordDate(maintenanceRecord)).toBe('2026-03-01');
    });

    it('returns an empty string when a record carries no date', () => {
      expect(getOdometerRecordDate({ mileage: 100 })).toBe('');
    });
  });

  describe('getLatestOdometerRecord', () => {
    it('picks the newest record across both record shapes', () => {
      expect(getLatestOdometerRecord([fuelRecord, maintenanceRecord])).toBe(maintenanceRecord);
    });

    it('skips records without a mileage reading', () => {
      const newerWithoutMileage: OdometerRecord = { date: '2026-04-01', mileage: null };

      expect(getLatestOdometerRecord([fuelRecord, newerWithoutMileage])).toBe(fuelRecord);
    });

    it('returns null when no record has a mileage reading', () => {
      expect(getLatestOdometerRecord([{ date: '2026-04-01', mileage: null }])).toBeNull();
      expect(getLatestOdometerRecord([])).toBeNull();
    });

    it('leaves the input list order untouched', () => {
      const records = [maintenanceRecord, fuelRecord];

      getLatestOdometerRecord(records);

      expect(records).toEqual([maintenanceRecord, fuelRecord]);
    });
  });

  describe('getLatestOdometerMileage', () => {
    it('prefers the latest recorded mileage over the fallback', () => {
      expect(getLatestOdometerMileage([fuelRecord, maintenanceRecord], 5_000)).toBe(21_000);
    });

    it('truncates the fallback when no record has a mileage reading', () => {
      expect(getLatestOdometerMileage([], 12_345.67)).toBe(12_345);
    });

    it('returns null when neither records nor fallback provide a mileage', () => {
      expect(getLatestOdometerMileage([], null)).toBeNull();
      expect(getLatestOdometerMileage([], undefined)).toBeNull();
    });
  });
});
