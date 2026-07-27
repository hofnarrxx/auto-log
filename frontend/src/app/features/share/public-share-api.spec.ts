import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../core/config/api-base-url.token';
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
      fuelEntries: [],
      maintenanceEntries: [],
    };

    api.getSharedVehicle('token-123').subscribe((result) => expect(result).toEqual(response));

    const req = httpMock.expectOne(`${BASE_URL}/share/token-123`);
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });
});
