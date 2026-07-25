import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  isAuthenticated = signal<boolean>(false);
  private readonly authApi = `${environment.apiBaseUrl}/api/auth`;

  constructor(private http: HttpClient) {
    if (window.location.pathname.startsWith('/share/')) {
      return;
    }

    this.checkAuth().subscribe({
      next: () => this.isAuthenticated.set(true),
      error: () => this.isAuthenticated.set(false),
    });
  }

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
