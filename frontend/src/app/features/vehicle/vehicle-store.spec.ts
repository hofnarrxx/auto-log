import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import type { Vehicle } from './models';
import { VehicleStore } from './vehicle-store';
import { VehicleApi } from './services/vehicle-api';
import { ShareLinkApi } from './services/share-link-api';

const VEHICLE: Vehicle = {
  id: 1,
  brand: 'Volvo',
  model: 'V60',
  year: 2019,
  fuelType: 'Diesel',
  mileage: 1000,
};

describe('VehicleStore', () => {
  let store: VehicleStore;
  let vehicleApi: jasmine.SpyObj<VehicleApi>;
  let shareLinkApi: jasmine.SpyObj<ShareLinkApi>;

  beforeEach(() => {
    vehicleApi = jasmine.createSpyObj<VehicleApi>('VehicleApi', [
      'getAll',
      'create',
      'update',
      'remove',
      'requestImageUploadUrl',
    ]);
    shareLinkApi = jasmine.createSpyObj<ShareLinkApi>('ShareLinkApi', ['create', 'list', 'revoke']);

    TestBed.configureTestingModule({
      providers: [
        { provide: VehicleApi, useValue: vehicleApi },
        { provide: ShareLinkApi, useValue: shareLinkApi },
      ],
    });

    store = TestBed.inject(VehicleStore);
  });

  it('populates vehicles after a successful load', () => {
    vehicleApi.getAll.and.returnValue(of([VEHICLE]));

    store.load();

    expect(store.vehicles()).toEqual([VEHICLE]);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('sets an error and clears vehicles when loading fails', () => {
    vehicleApi.getAll.and.returnValue(throwError(() => new Error('boom')));

    store.load();

    expect(store.vehicles()).toEqual([]);
    expect(store.error()).toBe('dashboard.errors.loadFailed');
  });

  it('appends a created vehicle to the list', () => {
    vehicleApi.create.and.returnValue(of(VEHICLE));

    store
      .add({
        brand: 'Volvo',
        model: 'V60',
        year: 2019,
        mileage: 1000,
        fuelType: 'Diesel',
        licensePlate: null,
        imageKey: null,
      })
      .subscribe();

    expect(store.vehicles()).toEqual([VEHICLE]);
  });

  it('removes a vehicle from the list after deletion', () => {
    vehicleApi.getAll.and.returnValue(of([VEHICLE]));
    vehicleApi.remove.and.returnValue(of(undefined));

    store.load();
    store.remove(VEHICLE.id).subscribe();

    expect(store.vehicles()).toEqual([]);
  });

  it('delegates share-link operations to ShareLinkApi', () => {
    shareLinkApi.list.and.returnValue(of([]));

    store.listShareLinks(VEHICLE.id).subscribe();

    expect(shareLinkApi.list).toHaveBeenCalledWith(VEHICLE.id);
  });
});
