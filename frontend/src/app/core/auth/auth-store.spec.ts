import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { AuthApi } from './auth-api';
import { AuthStore } from './auth-store';

describe('AuthStore', () => {
  let store: AuthStore;
  let authApi: jasmine.SpyObj<AuthApi>;

  beforeEach(() => {
    authApi = jasmine.createSpyObj<AuthApi>('AuthApi', [
      'login',
      'register',
      'verifyEmail',
      'logout',
      'checkAuth',
      'refreshSession',
      'startDemo',
      'linkGoogle',
      'changePassword',
      'setPassword',
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

  it('marks the user authenticated after linking Google', () => {
    authApi.linkGoogle.and.returnValue(of(undefined));

    store.linkGoogle('secret').subscribe();

    expect(authApi.linkGoogle).toHaveBeenCalledWith('secret');
    expect(store.isAuthenticated()).toBe(true);
    expect(store.isDemo()).toBe(false);
  });

  it('does not authenticate the user after a successful register', () => {
    authApi.register.and.returnValue(of(undefined));

    store.register('a@b.com', 'secret', 'en').subscribe();

    expect(authApi.register).toHaveBeenCalledWith('a@b.com', 'secret', 'en');
    expect(store.isAuthenticated()).toBe(false);
  });

  it('marks the user authenticated after verifying the email', () => {
    authApi.verifyEmail.and.returnValue(of(undefined));

    store.verifyEmail('raw-token').subscribe();

    expect(authApi.verifyEmail).toHaveBeenCalledWith('raw-token');
    expect(store.isAuthenticated()).toBe(true);
    expect(store.isDemo()).toBe(false);
    expect(store.hasLocalLogin()).toBe(true);
  });

  it('stays unauthenticated when verifying the email fails', () => {
    authApi.verifyEmail.and.returnValue(throwError(() => new Error('invalid')));

    store.verifyEmail('bad-token').subscribe({ error: () => undefined });

    expect(store.isAuthenticated()).toBe(false);
  });

  it('marks the user unauthenticated after logout', () => {
    authApi.login.and.returnValue(of(undefined));
    authApi.logout.and.returnValue(of(undefined));

    store.login('a@b.com', 'secret').subscribe();
    store.logout().subscribe();

    expect(store.isAuthenticated()).toBe(false);
  });

  it('marks the user authenticated after a successful session check', () => {
    authApi.checkAuth.and.returnValue(of({ auth: 'a@b.com', demo: false, local: true }));

    store.checkAuth().subscribe();

    expect(store.isAuthenticated()).toBe(true);
  });

  it('sets hasLocalLogin from the session check response', () => {
    authApi.checkAuth.and.returnValue(of({ auth: 'g@b.com', demo: false, local: false }));

    store.checkAuth().subscribe();

    expect(store.hasLocalLogin()).toBe(false);

    authApi.checkAuth.and.returnValue(of({ auth: 'a@b.com', demo: false, local: true }));

    store.checkAuth().subscribe();

    expect(store.hasLocalLogin()).toBe(true);
  });

  it('marks the account as having a local login after a password login', () => {
    authApi.login.and.returnValue(of(undefined));

    store.login('a@b.com', 'secret').subscribe();

    expect(store.hasLocalLogin()).toBe(true);
  });

  it('marks a Google-only account as local after setting a password', () => {
    authApi.checkAuth.and.returnValue(of({ auth: 'g@b.com', demo: false, local: false }));
    authApi.setPassword.and.returnValue(of(undefined));

    store.checkAuth().subscribe();
    store.setPassword('NewPass1!').subscribe();

    expect(authApi.setPassword).toHaveBeenCalledWith('NewPass1!');
    expect(store.hasLocalLogin()).toBe(true);
  });

  it('keeps hasLocalLogin unchanged when setting a password fails', () => {
    authApi.checkAuth.and.returnValue(of({ auth: 'g@b.com', demo: false, local: false }));
    authApi.setPassword.and.returnValue(throwError(() => new Error('rejected')));

    store.checkAuth().subscribe();
    store.setPassword('NewPass1!').subscribe({ error: () => undefined });

    expect(store.hasLocalLogin()).toBe(false);
  });

  it('delegates changing the password to the api without touching the session', () => {
    authApi.changePassword.and.returnValue(of(undefined));

    store.changePassword('OldPass1!', 'NewPass1!').subscribe();

    expect(authApi.changePassword).toHaveBeenCalledWith('OldPass1!', 'NewPass1!');
    expect(store.isAuthenticated()).toBe(false);
  });

  it('clears hasLocalLogin on logout', () => {
    authApi.login.and.returnValue(of(undefined));
    authApi.logout.and.returnValue(of(undefined));

    store.login('a@b.com', 'secret').subscribe();
    store.logout().subscribe();

    expect(store.hasLocalLogin()).toBe(false);
  });

  it('sets isDemo from the session check response', () => {
    authApi.checkAuth.and.returnValue(of({ auth: 'demo@autolog.app', demo: true, local: true }));

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

  it('shares a single refresh request between overlapping callers', () => {
    const response$ = new Subject<void>();
    authApi.refreshSession.and.returnValue(response$);
    const completed: number[] = [];

    store.refreshAndAuthenticate().subscribe({ complete: () => completed.push(1) });
    store.refreshAndAuthenticate().subscribe({ complete: () => completed.push(2) });

    expect(authApi.refreshSession).toHaveBeenCalledTimes(1);

    response$.next();
    response$.complete();

    expect(completed).toEqual([1, 2]);
    expect(store.isAuthenticated()).toBe(true);
  });

  it('starts a new refresh once the previous one has completed', () => {
    authApi.refreshSession.and.returnValue(of(undefined));

    store.refreshAndAuthenticate().subscribe();
    store.refreshAndAuthenticate().subscribe();

    expect(authApi.refreshSession).toHaveBeenCalledTimes(2);
  });

  it('propagates a refresh failure to all callers and allows a new attempt afterwards', () => {
    const response$ = new Subject<void>();
    authApi.refreshSession.and.returnValue(response$);
    const errors: unknown[] = [];

    store.refreshAndAuthenticate().subscribe({ error: (e) => errors.push(e) });
    store.refreshAndAuthenticate().subscribe({ error: (e) => errors.push(e) });
    response$.error(new Error('expired'));

    expect(authApi.refreshSession).toHaveBeenCalledTimes(1);
    expect(errors.length).toBe(2);
    expect(store.isAuthenticated()).toBe(false);

    authApi.refreshSession.and.returnValue(of(undefined));
    store.refreshAndAuthenticate().subscribe();

    expect(authApi.refreshSession).toHaveBeenCalledTimes(2);
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

    store.startDemo('en').subscribe();

    expect(authApi.startDemo).toHaveBeenCalledWith('en');
    expect(store.isAuthenticated()).toBe(true);
    expect(store.isDemo()).toBe(true);
  });

  it('clears isDemo after logging out of a demo session', () => {
    authApi.startDemo.and.returnValue(of(undefined));
    authApi.logout.and.returnValue(of(undefined));

    store.startDemo('en').subscribe();
    store.logout().subscribe();

    expect(store.isDemo()).toBe(false);
  });

  it('clears isDemo when a real login follows a demo session', () => {
    authApi.startDemo.and.returnValue(of(undefined));
    authApi.login.and.returnValue(of(undefined));

    store.startDemo('en').subscribe();
    store.login('a@b.com', 'secret').subscribe();

    expect(store.isDemo()).toBe(false);
  });

  it('clears isDemo when markUnauthenticated is called', () => {
    authApi.startDemo.and.returnValue(of(undefined));

    store.startDemo('en').subscribe();
    store.markUnauthenticated();

    expect(store.isDemo()).toBe(false);
  });

  it('exposes isDemo as read-only to callers', () => {
    expect((store.isDemo as unknown as { set?: unknown }).set).toBeUndefined();
  });
});
