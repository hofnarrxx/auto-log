import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  isAuthenticated = signal<boolean>(false);
  private readonly authApi = `${inject(API_BASE_URL)}/api/auth`;

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http
      .post(`${this.authApi}/login`, { email, password })
      .pipe(tap(() => this.isAuthenticated.set(true)));
  }

  register(email: string, password: string) {
    return this.http
      .post(`${this.authApi}/register`, { email, password })
      .pipe(tap(() => this.isAuthenticated.set(true)));
  }

  refreshSession() {
    return this.http
      .post<void>(`${this.authApi}/refresh`, {})
      .pipe(tap(() => this.isAuthenticated.set(true)));
  }

  logout() {
    return this.http
      .post(`${this.authApi}/logout`, {})
      .pipe(tap(() => this.isAuthenticated.set(false)));
  }

  checkAuth() {
    return this.http.get(`${this.authApi}/me`);
  }
}
