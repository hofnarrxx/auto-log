import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { MaintenanceQuery, MaintenanceRecordPayload, MaintenanceSummary } from '../models';
import { DEFAULT_MAINTENANCE_QUERY } from '../models';
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

  it('requests a page of maintenance records with page, size and sort params, omitting unset filters', () => {
    api.getPage(3, DEFAULT_MAINTENANCE_QUERY).subscribe();

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/vehicles/3/maintenance` && request.method === 'GET'
    );
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.get('sort')).toBe('newest');
    expect(req.request.params.has('categoriesCsv')).toBe(false);
    expect(req.request.params.has('currency')).toBe(false);
    expect(req.request.params.has('minCost')).toBe(false);
    expect(req.request.params.has('maxCost')).toBe(false);
    req.flush({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
  });

  it('joins categories into categoriesCsv and includes the other filters', () => {
    const query: MaintenanceQuery = {
      page: 1,
      size: 10,
      sort: 'price-high-low',
      title: '  brake  ',
      categories: ['Oil change', 'Repair'],
      currency: 'EUR',
      minCost: 10,
      maxCost: 200,
    };

    api.getPage(3, query).subscribe();

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/vehicles/3/maintenance` && request.method === 'GET'
    );
    expect(req.request.params.get('categoriesCsv')).toBe('Oil change,Repair');
    expect(req.request.params.get('title')).toBe('brake');
    expect(req.request.params.get('currency')).toBe('EUR');
    expect(req.request.params.get('minCost')).toBe('10');
    expect(req.request.params.get('maxCost')).toBe('200');
    req.flush({ items: [], page: 1, size: 10, totalElements: 0, totalPages: 0 });
  });

  it('sends an empty categoriesCsv when categories is explicitly empty', () => {
    api.getPage(3, { ...DEFAULT_MAINTENANCE_QUERY, categories: [] }).subscribe();

    const req = httpMock.expectOne(
      (request) => request.url === `${BASE_URL}/vehicles/3/maintenance` && request.method === 'GET'
    );
    expect(req.request.params.get('categoriesCsv')).toBe('');
    req.flush({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
  });

  it('requests the maintenance summary for a vehicle', () => {
    const summary: MaintenanceSummary = {
      totalRecords: 0,
      totalCostByCurrency: {},
      latestOdometer: null,
      mileageWarningRecordIds: [],
      maxCost: 0,
    };

    api.getSummary(3).subscribe((result) => expect(result).toEqual(summary));

    const req = httpMock.expectOne(`${BASE_URL}/vehicles/3/maintenance/summary`);
    expect(req.request.method).toBe('GET');
    req.flush(summary);
  });

  it('requests a single maintenance record by id', () => {
    api.getById(3, 9).subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/vehicles/3/maintenance/9`);
    expect(req.request.method).toBe('GET');
    req.flush({});
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
