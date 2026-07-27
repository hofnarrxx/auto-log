import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthApi } from './auth-api';

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

  login(email: string, password: string): Observable<void> {
    return this.authApi.login(email, password).pipe(tap(() => this._isAuthenticated.set(true)));
  }

  register(email: string, password: string): Observable<void> {
    return this.authApi.register(email, password).pipe(tap(() => this._isAuthenticated.set(true)));
  }

  logout(): Observable<void> {
    return this.authApi.logout().pipe(tap(() => this._isAuthenticated.set(false)));
  }

  checkAuth(): Observable<void> {
    return this.authApi.checkAuth().pipe(tap(() => this._isAuthenticated.set(true)));
  }

  refreshAndAuthenticate(): Observable<void> {
    return this.authApi.refreshSession().pipe(tap(() => this._isAuthenticated.set(true)));
  }

  markUnauthenticated(): void {
    this._isAuthenticated.set(false);
  }
}
