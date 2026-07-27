import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import type { FuelRecord, FuelRecordPayload } from './models';
import { FuelStore } from './fuel-store';
import { FuelApi } from './services/fuel-api';

const RECORD: FuelRecord = {
  id: 1,
  vehicleId: 1,
  date: '2026-01-01',
  mileage: 1000,
  cost: 200,
  amount: 40,
  gasStation: null,
  currency: 'PLN',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const PAYLOAD: FuelRecordPayload = {
  date: '2026-01-01',
  amount: 40,
  cost: 200,
  mileage: 1000,
  gasStation: null,
  currency: 'PLN',
};

describe('FuelStore', () => {
  let store: FuelStore;
  let fuelApi: jasmine.SpyObj<FuelApi>;

  beforeEach(() => {
    fuelApi = jasmine.createSpyObj<FuelApi>('FuelApi', ['getAll', 'create', 'update', 'remove']);

    TestBed.configureTestingModule({
      providers: [FuelStore, { provide: FuelApi, useValue: fuelApi }],
    });

    store = TestBed.inject(FuelStore);
  });

  it('starts empty and not loading', () => {
    expect(store.records()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('populates records after a successful load', () => {
    fuelApi.getAll.and.returnValue(of([RECORD]));

    store.load(1);

    expect(store.records()).toEqual([RECORD]);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('sets an error and clears records when loading fails', () => {
    fuelApi.getAll.and.returnValue(throwError(() => new Error('boom')));

    store.load(1);

    expect(store.records()).toEqual([]);
    expect(store.error()).toBe('vehicle.fuelTab.errors.loadFailed');
  });

  it('cancels a stale in-flight load when a newer one starts', () => {
    const first$ = new Subject<FuelRecord[]>();
    const second$ = new Subject<FuelRecord[]>();
    fuelApi.getAll.withArgs(1).and.returnValue(first$);
    fuelApi.getAll.withArgs(2).and.returnValue(second$);

    store.load(1);
    store.load(2);

    second$.next([RECORD]);
    first$.next([{ ...RECORD, id: 999 }]);

    expect(store.records()).toEqual([RECORD]);
  });

  it('reloads records after a successful save', () => {
    fuelApi.create.and.returnValue(of(RECORD));
    fuelApi.getAll.and.returnValue(of([RECORD]));

    store.save(1, PAYLOAD).subscribe();

    expect(fuelApi.getAll).toHaveBeenCalledWith(1);
    expect(store.records()).toEqual([RECORD]);
    expect(store.isSaving()).toBe(false);
  });

  it('reloads records after a successful delete', () => {
    fuelApi.remove.and.returnValue(of(undefined));
    fuelApi.getAll.and.returnValue(of([]));

    store.delete(1, RECORD.id).subscribe();

    expect(fuelApi.getAll).toHaveBeenCalledWith(1);
    expect(store.records()).toEqual([]);
    expect(store.isDeleting()).toBe(false);
  });
});
