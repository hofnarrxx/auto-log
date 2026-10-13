import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, shareReplay, tap } from 'rxjs';
import { AuthApi, type AuthResponse } from './auth-api';

/**
 * Owns the single `isAuthenticated` flag derived from the auth endpoints. Every state
 * transition happens here so callers never need to set the flag themselves.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private readonly authApi = inject(AuthApi);

  private readonly _isAuthenticated = signal(false);
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  private readonly _isDemo = signal(false);
  readonly isDemo = this._isDemo.asReadonly();

  /** Whether the account can sign in with email + password. False for Google-only accounts. */
  private readonly _hasLocalLogin = signal(false);
  readonly hasLocalLogin = this._hasLocalLogin.asReadonly();

  login(email: string, password: string): Observable<void> {
    return this.authApi.login(email, password).pipe(
      tap(() => {
        this._isAuthenticated.set(true);
        this._isDemo.set(false);
        this._hasLocalLogin.set(true);
      })
    );
  }

  linkGoogle(password: string): Observable<void> {
    return this.authApi.linkGoogle(password).pipe(
      tap(() => {
        this._isAuthenticated.set(true);
        this._isDemo.set(false);
        this._hasLocalLogin.set(true);
      })
    );
  }

  /** Registering only sends a verification email; the user is not signed in until they verify. */
  register(email: string, password: string, lang: string): Observable<void> {
    return this.authApi.register(email, password, lang);
  }

  verifyEmail(token: string): Observable<void> {
    return this.authApi.verifyEmail(token).pipe(
      tap(() => {
        this._isAuthenticated.set(true);
        this._isDemo.set(false);
        this._hasLocalLogin.set(true);
      })
    );
  }

  startDemo(lang: string): Observable<void> {
    return this.authApi.startDemo(lang).pipe(
      tap(() => {
        this._isAuthenticated.set(true);
        this._isDemo.set(true);
        this._hasLocalLogin.set(true);
      })
    );
  }

  logout(): Observable<void> {
    return this.authApi.logout().pipe(
      tap(() => {
        this._isAuthenticated.set(false);
        this._isDemo.set(false);
        this._hasLocalLogin.set(false);
      })
    );
  }

  checkAuth(): Observable<AuthResponse> {
    return this.authApi.checkAuth().pipe(
      tap((response) => {
        this._isAuthenticated.set(true);
        this._isDemo.set(response.demo);
        this._hasLocalLogin.set(response.local);
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.authApi.changePassword(currentPassword, newPassword);
  }

  /** A Google-only account gains a local login, so the Settings form switches to "change". */
  setPassword(newPassword: string): Observable<void> {
    return this.authApi.setPassword(newPassword).pipe(tap(() => this._hasLocalLogin.set(true)));
  }

  /**
   * Refresh tokens are single-use, so concurrent callers (e.g. several parallel requests that all
   * got a 401) must share one in-flight refresh instead of each sending their own.
   */
  private refreshInFlight$: Observable<void> | null = null;

  refreshAndAuthenticate(): Observable<void> {
    // No body to read `demo`/`local` from here, so `_isDemo` and `_hasLocalLogin` are left
    // untouched: they were already set correctly by the `checkAuth()`/`startDemo()` call that
    // started this session.
    this.refreshInFlight$ ??= this.authApi.refreshSession().pipe(
      tap(() => this._isAuthenticated.set(true)),
      finalize(() => (this.refreshInFlight$ = null)),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.refreshInFlight$;
  }

  markUnauthenticated(): void {
    this._isAuthenticated.set(false);
    this._isDemo.set(false);
    this._hasLocalLogin.set(false);
  }
}
