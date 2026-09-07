import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { DEFAULT_FUEL_QUERY, DEFAULT_MAINTENANCE_QUERY } from '../vehicle/models';
import type { MaintenanceRecord } from '../vehicle/models';
import type { SharedVehicleResponse } from './shared-vehicle-model';
import { PublicShareApi } from './public-share-api';

const BASE_URL = 'https://api.test';

describe('PublicShareApi', () => {
  let api: PublicShareApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });

    api = TestBed.inject(PublicShareApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests a shared vehicle by token', () => {
    const response: SharedVehicleResponse = {
      carId: 1,
      brand: 'Volvo',
      model: 'V60',
      fuelType: 'Diesel',
      mileage: 1000,
      year: 2019,
      fuelSummary: {
        totalRecords: 0,
        totalCostByCurrency: {},
        latestOdometerRecord: null,
        mileageWarningRecordIds: [],
        averageConsumptionPer100km: null,
      },
      maintenanceSummary: {
        totalRecords: 0,
        totalCostByCurrency: {},
        latestOdometer: null,
        mileageWarningRecordIds: [],
        maxCost: 0,
      },
    };

    api.getSharedVehicle('token-123').subscribe((result) => expect(result).toEqual(response));

    const req = httpMock.expectOne(`${BASE_URL}/share/token-123`);
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });

  it('requests a page of fuel records for a share token with page, size and sort params', () => {
    api.getFuelPage('token-123', DEFAULT_FUEL_QUERY).subscribe();

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/share/token-123/fuel` && request.method === 'GET'
    );
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.get('sort')).toBe('newest');
    expect(req.request.params.has('gasStation')).toBe(false);
    req.flush({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
  });

  it('requests a page of maintenance records for a share token with all filters', () => {
    api
      .getMaintenancePage('token-123', {
        ...DEFAULT_MAINTENANCE_QUERY,
        title: 'brakes',
        categories: ['Repair'],
        currency: 'EUR',
        minCost: 10,
        maxCost: 200,
      })
      .subscribe();

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${BASE_URL}/share/token-123/maintenance` && request.method === 'GET'
    );
    expect(req.request.params.get('title')).toBe('brakes');
    expect(req.request.params.get('categoriesCsv')).toBe('Repair');
    expect(req.request.params.get('currency')).toBe('EUR');
    expect(req.request.params.get('minCost')).toBe('10');
    expect(req.request.params.get('maxCost')).toBe('200');
    req.flush({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
  });

  it('requests a single maintenance record by id for a shared vehicle', () => {
    const response: MaintenanceRecord = {
      id: 5,
      vehicleId: 1,
      serviceDate: '2024-01-01',
      title: 'Oil change',
      mileage: 1000,
      category: 'Repair',
      description: '',
      cost: 50,
      currency: 'EUR',
      attachments: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    api.getMaintenanceById('token-123', 5).subscribe((result) => expect(result).toEqual(response));

    const req = httpMock.expectOne(`${BASE_URL}/share/token-123/maintenance/5`);
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });

  it('requests a maintenance attachment download url for a shared vehicle', () => {
    const response = { downloadUrl: 'https://files.test/attachment.pdf' };

    api
      .getMaintenanceAttachmentDownloadUrl('token-123', 5, 9)
      .subscribe((result) => expect(result).toEqual(response));

    const req = httpMock.expectOne(
      `${BASE_URL}/share/token-123/maintenance/5/attachments/9/download-url`
    );
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });
});
