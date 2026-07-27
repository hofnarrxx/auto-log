import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthApi } from './auth-api';
import { AuthStore } from './auth-store';

describe('AuthStore', () => {
  let store: AuthStore;
  let authApi: jasmine.SpyObj<AuthApi>;

  beforeEach(() => {
    authApi = jasmine.createSpyObj<AuthApi>('AuthApi', [
      'login',
      'register',
      'logout',
      'checkAuth',
      'refreshSession',
    ]);

    TestBed.configureTestingModule({
      providers: [{ provide: AuthApi, useValue: authApi }],
    });

    store = TestBed.inject(AuthStore);
  });

  it('starts unauthenticated', () => {
    expect(store.isAuthenticated()).toBe(false);
  });

  it('marks the user authenticated after a successful login', () => {
    authApi.login.and.returnValue(of(undefined));

    store.login('a@b.com', 'secret').subscribe();

    expect(store.isAuthenticated()).toBe(true);
  });

  it('marks the user authenticated after a successful register', () => {
    authApi.register.and.returnValue(of(undefined));

    store.register('a@b.com', 'secret').subscribe();

    expect(store.isAuthenticated()).toBe(true);
  });

  it('marks the user unauthenticated after logout', () => {
    authApi.login.and.returnValue(of(undefined));
    authApi.logout.and.returnValue(of(undefined));

    store.login('a@b.com', 'secret').subscribe();
    store.logout().subscribe();

    expect(store.isAuthenticated()).toBe(false);
  });

  it('marks the user authenticated after a successful session check', () => {
    authApi.checkAuth.and.returnValue(of(undefined));

    store.checkAuth().subscribe();

    expect(store.isAuthenticated()).toBe(true);
  });

  it('does not change authentication state when the session check fails', () => {
    authApi.checkAuth.and.returnValue(throwError(() => new Error('unauthorized')));

    store.checkAuth().subscribe({ error: () => undefined });

    expect(store.isAuthenticated()).toBe(false);
  });

  it('marks the user authenticated after a successful refresh', () => {
    authApi.refreshSession.and.returnValue(of(undefined));

    store.refreshAndAuthenticate().subscribe();

    expect(store.isAuthenticated()).toBe(true);
  });

  it('marks the user unauthenticated on demand', () => {
    authApi.login.and.returnValue(of(undefined));

    store.login('a@b.com', 'secret').subscribe();
    store.markUnauthenticated();

    expect(store.isAuthenticated()).toBe(false);
  });

  it('exposes isAuthenticated as read-only to callers', () => {
    expect((store.isAuthenticated as unknown as { set?: unknown }).set).toBeUndefined();
  });
});
