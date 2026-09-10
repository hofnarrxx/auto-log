import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { FuelQuery, FuelRecordPayload, FuelSummary } from '../models';
import { DEFAULT_FUEL_QUERY } from '../models';
import { FuelApi } from './fuel-api';

const BASE_URL = 'https://api.test';

describe('FuelApi', () => {
  let api: FuelApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });

    api = TestBed.inject(FuelApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests a page of fuel records with page, size and sort params', () => {
    api.getPage(3, DEFAULT_FUEL_QUERY).subscribe();

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/vehicles/3/fuel` && request.method === 'GET'
    );
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('sort')).toBe('newest');
    expect(req.request.params.has('gasStation')).toBe(false);
    req.flush({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
  });

  it('includes a trimmed gasStation param when provided', () => {
    const query: FuelQuery = { page: 1, size: 10, sort: 'price-low-high', gasStation: '  Shell ' };

    api.getPage(3, query).subscribe();

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/vehicles/3/fuel` && request.method === 'GET'
    );
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('sort')).toBe('price-low-high');
    expect(req.request.params.get('gasStation')).toBe('Shell');
    req.flush({ items: [], page: 1, size: 10, totalElements: 0, totalPages: 0 });
  });

  it('requests the fuel summary for a vehicle', () => {
    const summary: FuelSummary = {
      totalRecords: 0,
      totalCostByCurrency: {},
      latestOdometerRecord: null,
      mileageWarningRecordIds: [],
      averageConsumptionPer100km: null,
    };

    api.getSummary(3).subscribe((result) => expect(result).toEqual(summary));

    const req = httpMock.expectOne(`${BASE_URL}/vehicles/3/fuel/summary`);
    expect(req.request.method).toBe('GET');
    req.flush(summary);
  });

  it('creates a fuel record under a vehicle', () => {
    const payload: FuelRecordPayload = {
      date: '2026-01-01',
      amount: 40,
      cost: 200,
      mileage: 1000,
      gasStation: null,
      currency: 'PLN',
    };

    api.create(3, payload).subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/vehicles/3/fuel`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('updates an existing fuel record', () => {
    const payload: FuelRecordPayload = {
      date: '2026-01-01',
      amount: 40,
      cost: 200,
      mileage: 1000,
      gasStation: null,
      currency: 'PLN',
    };

    api.update(3, 9, payload).subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/vehicles/3/fuel/9`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('deletes a fuel record', () => {
    api.remove(3, 9).subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/vehicles/3/fuel/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
