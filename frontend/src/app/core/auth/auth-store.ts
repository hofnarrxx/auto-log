import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
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

  login(email: string, password: string): Observable<void> {
    return this.authApi.login(email, password).pipe(
      tap(() => {
        this._isAuthenticated.set(true);
        this._isDemo.set(false);
      })
    );
  }

  register(email: string, password: string): Observable<void> {
    return this.authApi.register(email, password).pipe(
      tap(() => {
        this._isAuthenticated.set(true);
        this._isDemo.set(false);
      })
    );
  }

  startDemo(): Observable<void> {
    return this.authApi.startDemo().pipe(
      tap(() => {
        this._isAuthenticated.set(true);
        this._isDemo.set(true);
      })
    );
  }

  logout(): Observable<void> {
    return this.authApi.logout().pipe(
      tap(() => {
        this._isAuthenticated.set(false);
        this._isDemo.set(false);
      })
    );
  }

  checkAuth(): Observable<AuthResponse> {
    return this.authApi.checkAuth().pipe(
      tap((response) => {
        this._isAuthenticated.set(true);
        this._isDemo.set(response.demo);
      })
    );
  }

  refreshAndAuthenticate(): Observable<void> {
    // No body to read `demo` from here, so `_isDemo` is left untouched: it was already set
    // correctly by the `checkAuth()`/`startDemo()` call that started this session.
    return this.authApi.refreshSession().pipe(tap(() => this._isAuthenticated.set(true)));
  }

  markUnauthenticated(): void {
    this._isAuthenticated.set(false);
    this._isDemo.set(false);
  }
}
