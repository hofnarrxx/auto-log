import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';

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

  checkAuth(): Observable<void> {
    return this.http.get<void>(`${this.authApi}/me`);
  }
}
