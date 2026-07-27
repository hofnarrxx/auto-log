import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { FuelRecord, FuelRecordPayload } from '../models';
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

  it('requests fuel records for a vehicle', () => {
    const records: FuelRecord[] = [];

    api.getAll(3).subscribe((result) => expect(result).toBe(records));

    const req = httpMock.expectOne(`${BASE_URL}/vehicles/3/fuel`);
    expect(req.request.method).toBe('GET');
    req.flush(records);
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
