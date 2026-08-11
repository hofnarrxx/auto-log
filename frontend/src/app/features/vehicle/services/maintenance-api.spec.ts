import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { MaintenanceRecordPayload } from '../models';
import { MaintenanceApi } from './maintenance-api';

const BASE_URL = 'https://api.test';

describe('MaintenanceApi', () => {
  let api: MaintenanceApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });

    api = TestBed.inject(MaintenanceApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests maintenance categories from the metadata endpoint', () => {
    api.getCategories().subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/metadata/maintenance/categories`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('requests maintenance records for a vehicle', () => {
    api.getMaintenance(3).subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/vehicles/3/maintenance`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('creates a maintenance record under a vehicle', () => {
    const payload: MaintenanceRecordPayload = {
      serviceDate: '2026-01-01',
      title: 'Oil change',
      mileage: 1000,
      category: 'Oil change',
      description: '',
      cost: 100,
      currency: 'PLN',
    };

    api.createMaintenance(3, payload).subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/vehicles/3/maintenance`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('requests an attachment upload url with file metadata', () => {
    const file = new File(['x'], 'invoice.pdf', { type: 'application/pdf' });

    api.getAttachmentUploadUrl(3, 9, file).subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/vehicles/3/maintenance/9/attachments/upload-url`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      fileName: 'invoice.pdf',
      contentType: 'application/pdf',
      sizeBytes: file.size,
    });
    req.flush({ uploadUrl: 'https://upload', objectKey: 'key' });
  });

  it('requests an attachment download url', () => {
    api.getAttachmentDownloadUrl(3, 9, 42).subscribe();

    const req = httpMock.expectOne(
      `${BASE_URL}/vehicles/3/maintenance/9/attachments/42/download-url`
    );
    expect(req.request.method).toBe('GET');
    req.flush({ downloadUrl: 'https://download' });
  });
});
