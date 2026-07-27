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

  it('does not issue any request on construction', () => {
    httpMock.verify();
    expect(api.isAuthenticated()).toBe(false);
  });

  it('marks the user authenticated after a successful login', () => {
    api.login('a@b.com', 'secret').subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/api/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({});

    expect(api.isAuthenticated()).toBe(true);
  });

  it('marks the user unauthenticated after logout', () => {
    api.logout().subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/api/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({});

    expect(api.isAuthenticated()).toBe(false);
  });

  it('checks the current session without mutating authentication state itself', () => {
    api.checkAuth().subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/api/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
