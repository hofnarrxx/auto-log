import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../config/api-base-url.token';
import { AuthApi } from './auth-api';

const BASE_URL = 'https://api.test';

describe('AuthApi', () => {
  let api: AuthApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });

    api = TestBed.inject(AuthApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('posts credentials to the login endpoint', () => {
    api.login('a@b.com', 'secret').subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/api/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.com', password: 'secret' });
    req.flush(null);
  });

  it('posts credentials to the register endpoint', () => {
    api.register('a@b.com', 'secret').subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/api/auth/register`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('posts to the refresh endpoint', () => {
    api.refreshSession().subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/api/auth/refresh`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('posts to the logout endpoint', () => {
    api.logout().subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/api/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('requests the current session from the me endpoint', () => {
    api.checkAuth().subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/api/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush(null);
  });
});
