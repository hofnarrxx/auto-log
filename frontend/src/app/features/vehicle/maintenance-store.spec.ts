import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import type { MaintenanceRecord, MaintenanceRecordPayload } from './models';
import { MaintenanceStore } from './maintenance-store';
import { MaintenanceApiService } from './services/maintenance-api.service';

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

describe('MaintenanceStore', () => {
  let store: MaintenanceStore;
  let maintenanceApi: jasmine.SpyObj<MaintenanceApiService>;

  beforeEach(() => {
    maintenanceApi = jasmine.createSpyObj<MaintenanceApiService>('MaintenanceApiService', [
      'getCategories',
      'getMaintenance',
      'createMaintenance',
      'updateMaintenance',
      'deleteMaintenance',
      'getAttachmentDownloadUrl',
    ]);

    TestBed.configureTestingModule({
      providers: [MaintenanceStore, { provide: MaintenanceApiService, useValue: maintenanceApi }],
    });

    store = TestBed.inject(MaintenanceStore);
  });

  it('populates records after a successful load', () => {
    maintenanceApi.getMaintenance.and.returnValue(of([RECORD]));

    store.load(1);

    expect(store.records()).toEqual([RECORD]);
    expect(store.isLoading()).toBe(false);
  });

  it('sets an error and clears records when loading fails', () => {
    maintenanceApi.getMaintenance.and.returnValue(throwError(() => new Error('boom')));

    store.load(1);

    expect(store.records()).toEqual([]);
    expect(store.error()).toBe('vehicle.maintenanceTab.errors.loadFailed');
  });

  it('cancels a stale in-flight load when a newer one starts', () => {
    const first$ = new Subject<MaintenanceRecord[]>();
    const second$ = new Subject<MaintenanceRecord[]>();
    maintenanceApi.getMaintenance.withArgs(1).and.returnValue(first$);
    maintenanceApi.getMaintenance.withArgs(2).and.returnValue(second$);

    store.load(1);
    store.load(2);

    second$.next([RECORD]);
    first$.next([{ ...RECORD, id: 999 }]);

    expect(store.records()).toEqual([RECORD]);
  });

  it('falls back to a default category list when categories fail to load', () => {
    maintenanceApi.getCategories.and.returnValue(throwError(() => new Error('boom')));

    store.loadCategories();

    expect(store.categories().length).toBeGreaterThan(0);
  });

  it('removes the deleted record locally after a successful delete', () => {
    maintenanceApi.getMaintenance.and.returnValue(of([RECORD]));
    maintenanceApi.deleteMaintenance.and.returnValue(of(undefined));

    store.load(1);
    store.delete(1, RECORD.id).subscribe();

    expect(store.records()).toEqual([]);
    expect(store.isDeleting()).toBe(false);
  });

  it('exposes save as an observable the caller drives', () => {
    maintenanceApi.createMaintenance.and.returnValue(of(RECORD));

    store.save(1, PAYLOAD).subscribe((saved) => {
      expect(saved).toEqual(RECORD);
    });

    expect(store.isSaving()).toBe(false);
  });
});
