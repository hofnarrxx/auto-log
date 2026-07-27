import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { CreateVehicleCommand, UpdateVehicleCommand, Vehicle } from '../models';
import { VehicleApi } from './vehicle-api';

const BASE_URL = 'https://api.test';

describe('VehicleApi', () => {
  let api: VehicleApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });

    api = TestBed.inject(VehicleApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests all vehicles from the vehicles endpoint', () => {
    const vehicles: Vehicle[] = [
      { id: 1, brand: 'Volvo', model: 'V60', year: 2019, fuelType: 'Diesel', mileage: 100 },
    ];

    api.getAll().subscribe((result) => expect(result).toEqual(vehicles));

    const req = httpMock.expectOne(`${BASE_URL}/vehicles`);
    expect(req.request.method).toBe('GET');
    req.flush(vehicles);
  });

  it('posts a create command to the vehicles endpoint', () => {
    const command: CreateVehicleCommand = {
      brand: 'Volvo',
      model: 'V60',
      year: 2019,
      mileage: 100,
      fuelType: 'Diesel',
      licensePlate: null,
      imageKey: null,
    };
    const created: Vehicle = { id: 1, ...command };

    api.create(command).subscribe((result) => expect(result).toEqual(created));

    const req = httpMock.expectOne(`${BASE_URL}/vehicles`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(command);
    req.flush(created);
  });

  it('puts an update command to the vehicle-specific endpoint', () => {
    const command: UpdateVehicleCommand = {
      id: 7,
      brand: 'Volvo',
      model: 'V60',
      year: 2019,
      mileage: 100,
      fuelType: 'Diesel',
      licensePlate: null,
      imageKey: null,
    };

    api.update(command).subscribe((result) => expect(result).toEqual(command));

    const req = httpMock.expectOne(`${BASE_URL}/vehicles/7`);
    expect(req.request.method).toBe('PUT');
    req.flush(command);
  });

  it('deletes a vehicle by id', () => {
    api.remove(7).subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/vehicles/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('requests an image upload url with file metadata', () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const response = { uploadUrl: 'https://upload', objectKey: 'vehicles/7/photo.jpg' };

    api.requestImageUploadUrl(7, file).subscribe((result) => expect(result).toEqual(response));

    const req = httpMock.expectOne(`${BASE_URL}/vehicles/7/image/upload-url`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      fileName: 'photo.jpg',
      contentType: 'image/jpeg',
      sizeBytes: file.size,
    });
    req.flush(response);
  });
});
