import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import type { Page } from '../../shared/models';
import type {
  MaintenanceQuery,
  MaintenanceRecord,
  MaintenanceRecordPayload,
  MaintenanceSummary,
} from './models';
import { MaintenanceStore } from './maintenance-store';
import { MaintenanceApi } from './services/maintenance-api';

const RECORD: MaintenanceRecord = {
  id: 1,
  vehicleId: 1,
  serviceDate: '2026-01-01',
  title: 'Oil change',
  mileage: 1000,
  category: 'Oil change',
  description: '',
  cost: 100,
  currency: 'PLN',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const PAYLOAD: MaintenanceRecordPayload = {
  serviceDate: '2026-01-01',
  title: 'Oil change',
  mileage: 1000,
  category: 'Oil change',
  description: '',
  cost: 100,
  currency: 'PLN',
};

function pageOf(
  items: MaintenanceRecord[],
  overrides: Partial<Page<MaintenanceRecord>> = {}
): Page<MaintenanceRecord> {
  return { items, page: 0, size: 20, totalElements: items.length, totalPages: 1, ...overrides };
}

describe('MaintenanceStore', () => {
  let store: MaintenanceStore;
  let maintenanceApi: jasmine.SpyObj<MaintenanceApi>;

  beforeEach(() => {
    maintenanceApi = jasmine.createSpyObj<MaintenanceApi>('MaintenanceApi', [
      'getCategories',
      'getPage',
      'getSummary',
      'getById',
      'createMaintenance',
      'updateMaintenance',
      'deleteMaintenance',
      'getAttachmentDownloadUrl',
    ]);

    TestBed.configureTestingModule({
      providers: [MaintenanceStore, { provide: MaintenanceApi, useValue: maintenanceApi }],
    });

    store = TestBed.inject(MaintenanceStore);
  });

  it('populates records and pagination state after a successful load', () => {
    maintenanceApi.getPage.and.returnValue(of(pageOf([RECORD])));

    store.load(1);

    expect(store.records()).toEqual([RECORD]);
    expect(store.totalElements()).toBe(1);
    expect(store.isLoading()).toBe(false);
    expect(store.hasLoadedOnce()).toBe(true);
  });

  it('does not toggle hasLoadedOnce off again for a subsequent sort/filter refetch', () => {
    maintenanceApi.getPage.and.returnValue(of(pageOf([RECORD])));
    store.load(1);
    expect(store.hasLoadedOnce()).toBe(true);

    store.setQuery({ sort: 'price-low-high' });

    expect(store.hasLoadedOnce()).toBe(true);
  });

  it('sets an error and clears records when loading fails', () => {
    maintenanceApi.getPage.and.returnValue(throwError(() => new Error('boom')));

    store.load(1);

    expect(store.records()).toEqual([]);
    expect(store.error()).toBe('vehicle.maintenanceTab.errors.loadFailed');
  });

  it('cancels a stale in-flight load when a newer one starts', () => {
    const first$ = new Subject<Page<MaintenanceRecord>>();
    const second$ = new Subject<Page<MaintenanceRecord>>();
    maintenanceApi.getPage.withArgs(1, jasmine.any(Object)).and.returnValue(first$);
    maintenanceApi.getPage.withArgs(2, jasmine.any(Object)).and.returnValue(second$);

    store.load(1);
    store.load(2);

    second$.next(pageOf([RECORD]));
    first$.next(pageOf([{ ...RECORD, id: 999 }]));

    expect(store.records()).toEqual([RECORD]);
  });

  it('falls back to a default category list when categories fail to load', () => {
    maintenanceApi.getCategories.and.returnValue(throwError(() => new Error('boom')));

    store.loadCategories();

    expect(store.categories().length).toBeGreaterThan(0);
  });

  it('resets the page to 0 when setQuery changes a filter', () => {
    maintenanceApi.getPage.and.returnValue(of(pageOf([RECORD], { page: 2 })));
    store.load(1);

    maintenanceApi.getPage.calls.reset();
    maintenanceApi.getPage.and.returnValue(of(pageOf([RECORD], { page: 0 })));

    store.setQuery({ categories: ['Oil change'] });

    const [, query]: [number, MaintenanceQuery] = maintenanceApi.getPage.calls.mostRecent()
      .args as [number, MaintenanceQuery];
    expect(query.page).toBe(0);
    expect(query.categories).toEqual(['Oil change']);
  });

  it('sends an explicitly empty categories array as-is (not "all")', () => {
    maintenanceApi.getPage.and.returnValue(of(pageOf([])));
    store.load(1);

    store.setQuery({ categories: [] });

    const [, query]: [number, MaintenanceQuery] = maintenanceApi.getPage.calls.mostRecent()
      .args as [number, MaintenanceQuery];
    expect(query.categories).toEqual([]);
  });

  it('loads the summary into its own signal', () => {
    const summary: MaintenanceSummary = {
      totalRecords: 1,
      totalCostByCurrency: { PLN: 100 },
      latestOdometer: { mileage: 1000, date: '2026-01-01' },
      mileageWarningRecordIds: [],
      maxCost: 100,
    };
    maintenanceApi.getSummary.and.returnValue(of(summary));

    store.loadSummary(1);

    expect(store.summary()).toEqual(summary);
  });

  it('reloads records and summary after a successful save', () => {
    maintenanceApi.createMaintenance.and.returnValue(of(RECORD));
    maintenanceApi.getPage.and.returnValue(of(pageOf([RECORD])));
    maintenanceApi.getSummary.and.returnValue(
      of({
        totalRecords: 1,
        totalCostByCurrency: {},
        latestOdometer: null,
        mileageWarningRecordIds: [],
        maxCost: 100,
      })
    );

    store.save(1, PAYLOAD).subscribe();

    expect(maintenanceApi.getPage).toHaveBeenCalled();
    expect(maintenanceApi.getSummary).toHaveBeenCalledWith(1);
    expect(store.records()).toEqual([RECORD]);
    expect(store.isSaving()).toBe(false);
  });

  it('clamps to the previous page after deleting the only record on the last page', () => {
    maintenanceApi.getPage.and.returnValue(
      of(pageOf([RECORD], { page: 2, totalElements: 1, totalPages: 3 }))
    );
    store.load(1);

    maintenanceApi.deleteMaintenance.and.returnValue(of(undefined));
    maintenanceApi.getSummary.and.returnValue(
      of({
        totalRecords: 0,
        totalCostByCurrency: {},
        latestOdometer: null,
        mileageWarningRecordIds: [],
        maxCost: 0,
      })
    );
    maintenanceApi.getPage.calls.reset();
    maintenanceApi.getPage.and.returnValue(
      of(pageOf([], { page: 1, totalElements: 0, totalPages: 2 }))
    );

    store.delete(1, RECORD.id).subscribe();

    const [, query]: [number, MaintenanceQuery] = maintenanceApi.getPage.calls.mostRecent()
      .args as [number, MaintenanceQuery];
    expect(query.page).toBe(1);
    expect(store.isDeleting()).toBe(false);
  });

  it('fetches a single record by id', () => {
    maintenanceApi.getById.and.returnValue(of(RECORD));

    store.getById(1, RECORD.id).subscribe((record) => {
      expect(record).toEqual(RECORD);
    });
  });
});
