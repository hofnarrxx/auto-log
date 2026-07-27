import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { ShareLinkResponse } from '../models';
import { ShareLinkApi } from './share-link-api';

const BASE_URL = 'https://api.test';

describe('ShareLinkApi', () => {
  let api: ShareLinkApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });

    api = TestBed.inject(ShareLinkApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates a share link with a future expiry and the requested attachment flag', () => {
    const response: ShareLinkResponse = {
      id: 1,
      token: 'abc',
      carId: 5,
      createdBy: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-01-08T00:00:00.000Z',
      revoked: false,
      includeAttachments: false,
    };

    api.create(5, false).subscribe((result) => expect(result).toEqual(response));

    const req = httpMock.expectOne(`${BASE_URL}/api/share-links`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.carId).toBe(5);
    expect(req.request.body.includeAttachments).toBe(false);
    expect(new Date(req.request.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    req.flush(response);
  });

  it('lists share links filtered by carId', () => {
    api.list(5).subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/api/share-links?carId=5`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('revokes a share link by id', () => {
    api.revoke(9).subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/api/share-links/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
