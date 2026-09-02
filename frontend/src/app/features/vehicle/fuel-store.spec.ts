import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import type { Page } from '../../shared/models';
import type { FuelQuery, FuelRecord, FuelRecordPayload, FuelSummary } from './models';
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

function pageOf(items: FuelRecord[], overrides: Partial<Page<FuelRecord>> = {}): Page<FuelRecord> {
  return { items, page: 0, size: 20, totalElements: items.length, totalPages: 1, ...overrides };
}

describe('FuelStore', () => {
  let store: FuelStore;
  let fuelApi: jasmine.SpyObj<FuelApi>;

  beforeEach(() => {
    fuelApi = jasmine.createSpyObj<FuelApi>('FuelApi', [
      'getPage',
      'getSummary',
      'create',
      'update',
      'remove',
    ]);

    TestBed.configureTestingModule({
      providers: [FuelStore, { provide: FuelApi, useValue: fuelApi }],
    });

    store = TestBed.inject(FuelStore);
  });

  it('starts empty and not loading', () => {
    expect(store.records()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.summary()).toBeNull();
  });

  it('populates records and pagination state after a successful load', () => {
    fuelApi.getPage.and.returnValue(
      of(pageOf([RECORD], { page: 0, size: 20, totalElements: 1, totalPages: 1 }))
    );

    store.load(1);

    expect(store.records()).toEqual([RECORD]);
    expect(store.totalElements()).toBe(1);
    expect(store.totalPages()).toBe(1);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.hasLoadedOnce()).toBe(true);
  });

  it('does not toggle hasLoadedOnce off again for a subsequent sort/filter refetch', () => {
    fuelApi.getPage.and.returnValue(of(pageOf([RECORD])));
    store.load(1);
    expect(store.hasLoadedOnce()).toBe(true);

    store.setQuery({ sort: 'price-low-high' });

    expect(store.hasLoadedOnce()).toBe(true);
  });

  it('sets an error and clears records when loading fails', () => {
    fuelApi.getPage.and.returnValue(throwError(() => new Error('boom')));

    store.load(1);

    expect(store.records()).toEqual([]);
    expect(store.error()).toBe('vehicle.fuelTab.errors.loadFailed');
  });

  it('cancels a stale in-flight load when a newer one starts', () => {
    const first$ = new Subject<Page<FuelRecord>>();
    const second$ = new Subject<Page<FuelRecord>>();
    fuelApi.getPage.withArgs(1, jasmine.any(Object)).and.returnValue(first$);
    fuelApi.getPage.withArgs(2, jasmine.any(Object)).and.returnValue(second$);

    store.load(1);
    store.load(2);

    second$.next(pageOf([RECORD]));
    first$.next(pageOf([{ ...RECORD, id: 999 }]));

    expect(store.records()).toEqual([RECORD]);
  });

  it('resets the page to 0 when setQuery changes a filter', () => {
    fuelApi.getPage.and.returnValue(of(pageOf([RECORD], { page: 2 })));
    store.load(1);

    fuelApi.getPage.calls.reset();
    fuelApi.getPage.and.returnValue(of(pageOf([RECORD], { page: 0 })));

    store.setQuery({ gasStation: 'Shell' });

    const [, query]: [number, FuelQuery] = fuelApi.getPage.calls.mostRecent().args as [
      number,
      FuelQuery,
    ];
    expect(query.page).toBe(0);
    expect(query.gasStation).toBe('Shell');
  });

  it('keeps sort and filter when setPage only changes the page', () => {
    fuelApi.getPage.and.returnValue(of(pageOf([RECORD])));
    store.load(1);
    store.setQuery({ sort: 'oldest' });

    store.setPage(3);

    const [, query]: [number, FuelQuery] = fuelApi.getPage.calls.mostRecent().args as [
      number,
      FuelQuery,
    ];
    expect(query.page).toBe(3);
    expect(query.sort).toBe('oldest');
  });

  it('resets the page when setSize changes the page size', () => {
    fuelApi.getPage.and.returnValue(of(pageOf([RECORD])));
    store.load(1);
    store.setPage(2);

    store.setSize(50);

    const [, query]: [number, FuelQuery] = fuelApi.getPage.calls.mostRecent().args as [
      number,
      FuelQuery,
    ];
    expect(query.page).toBe(0);
    expect(query.size).toBe(50);
  });

  it('loads the summary into its own signal', () => {
    const summary: FuelSummary = {
      totalRecords: 1,
      totalCostByCurrency: { PLN: 200 },
      latestOdometerRecord: { mileage: 1000, date: '2026-01-01' },
      mileageWarningRecordIds: [],
      averageConsumptionPer100km: 6.5,
    };
    fuelApi.getSummary.and.returnValue(of(summary));

    store.loadSummary(1);

    expect(store.summary()).toEqual(summary);
    expect(store.isSummaryLoading()).toBe(false);
  });

  it('reloads records and summary after a successful save', () => {
    fuelApi.create.and.returnValue(of(RECORD));
    fuelApi.getPage.and.returnValue(of(pageOf([RECORD])));
    fuelApi.getSummary.and.returnValue(
      of({
        totalRecords: 1,
        totalCostByCurrency: {},
        latestOdometerRecord: null,
        mileageWarningRecordIds: [],
        averageConsumptionPer100km: null,
      })
    );

    store.save(1, PAYLOAD).subscribe();

    expect(fuelApi.getPage).toHaveBeenCalled();
    expect(fuelApi.getSummary).toHaveBeenCalledWith(1);
    expect(store.records()).toEqual([RECORD]);
    expect(store.isSaving()).toBe(false);
  });

  it('clamps to the previous page after deleting the only record on the last page', () => {
    fuelApi.getPage.and.returnValue(
      of(pageOf([RECORD], { page: 2, totalElements: 1, totalPages: 3 }))
    );
    store.load(1);

    fuelApi.remove.and.returnValue(of(undefined));
    fuelApi.getSummary.and.returnValue(
      of({
        totalRecords: 0,
        totalCostByCurrency: {},
        latestOdometerRecord: null,
        mileageWarningRecordIds: [],
        averageConsumptionPer100km: null,
      })
    );
    fuelApi.getPage.calls.reset();
    fuelApi.getPage.and.returnValue(of(pageOf([], { page: 1, totalElements: 0, totalPages: 2 })));

    store.delete(1, RECORD.id).subscribe();

    const [, query]: [number, FuelQuery] = fuelApi.getPage.calls.mostRecent().args as [
      number,
      FuelQuery,
    ];
    expect(query.page).toBe(1);
    expect(store.isDeleting()).toBe(false);
  });
});
