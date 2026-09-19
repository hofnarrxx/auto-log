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
      'startDemo',
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
    authApi.checkAuth.and.returnValue(of({ auth: 'a@b.com', demo: false }));

    store.checkAuth().subscribe();

    expect(store.isAuthenticated()).toBe(true);
  });

  it('sets isDemo from the session check response', () => {
    authApi.checkAuth.and.returnValue(of({ auth: 'demo@autolog.app', demo: true }));

    store.checkAuth().subscribe();

    expect(store.isDemo()).toBe(true);
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

  it('starts unauthenticated as non-demo', () => {
    expect(store.isDemo()).toBe(false);
  });

  it('marks the session authenticated and demo after starting the demo', () => {
    authApi.startDemo.and.returnValue(of(undefined));

    store.startDemo().subscribe();

    expect(store.isAuthenticated()).toBe(true);
    expect(store.isDemo()).toBe(true);
  });

  it('clears isDemo after logging out of a demo session', () => {
    authApi.startDemo.and.returnValue(of(undefined));
    authApi.logout.and.returnValue(of(undefined));

    store.startDemo().subscribe();
    store.logout().subscribe();

    expect(store.isDemo()).toBe(false);
  });

  it('clears isDemo when a real login follows a demo session', () => {
    authApi.startDemo.and.returnValue(of(undefined));
    authApi.login.and.returnValue(of(undefined));

    store.startDemo().subscribe();
    store.login('a@b.com', 'secret').subscribe();

    expect(store.isDemo()).toBe(false);
  });

  it('clears isDemo when markUnauthenticated is called', () => {
    authApi.startDemo.and.returnValue(of(undefined));

    store.startDemo().subscribe();
    store.markUnauthenticated();

    expect(store.isDemo()).toBe(false);
  });

  it('exposes isDemo as read-only to callers', () => {
    expect((store.isDemo as unknown as { set?: unknown }).set).toBeUndefined();
  });
});
