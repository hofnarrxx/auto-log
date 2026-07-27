import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ObjectStorageApi } from './object-storage-api';

describe('ObjectStorageApi', () => {
  let api: ObjectStorageApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    api = TestBed.inject(ObjectStorageApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('puts the file directly to the presigned url with its content type', () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });

    api.upload('https://storage.test/upload?sig=abc', file).subscribe();

    const req = httpMock.expectOne('https://storage.test/upload?sig=abc');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toBe(file);
    expect(req.request.headers.get('Content-Type')).toBe('image/jpeg');
    req.flush('ok');
  });
});
