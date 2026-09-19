import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';

/**
 * Shape of `GET /api/auth/me`. `auth` is the signed-in user's email; `demo` tells the frontend
 * whether this session belongs to the shared, read-only demo account.
 */
export interface AuthResponse {
  auth: string;
  demo: boolean;
}

/**
 * Pure transport for the auth endpoints. This service holds no authentication state; see
 * {@link AuthStore} for the single source of truth on whether the user is signed in.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly authApi = `${inject(API_BASE_URL)}/api/auth`;

  login(email: string, password: string): Observable<void> {
    return this.http.post<void>(`${this.authApi}/login`, { email, password });
  }

  register(email: string, password: string): Observable<void> {
    return this.http.post<void>(`${this.authApi}/register`, { email, password });
  }

  refreshSession(): Observable<void> {
    return this.http.post<void>(`${this.authApi}/refresh`, {});
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.authApi}/logout`, {});
  }

  checkAuth(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.authApi}/me`);
  }

  startDemo(): Observable<void> {
    return this.http.post<void>(`${this.authApi}/demo`, {});
  }

  requestPasswordReset(email: string, lang: string): Observable<void> {
    return this.http.post<void>(`${this.authApi}/forgot-password`, { email, lang });
  }

  validateResetToken(token: string): Observable<void> {
    return this.http.get<void>(`${this.authApi}/reset-password/validate`, { params: { token } });
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.http.post<void>(`${this.authApi}/reset-password`, { token, password });
  }
}
