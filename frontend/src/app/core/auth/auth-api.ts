import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  isAuthenticated = signal<boolean>(false);

  constructor(private http: HttpClient) {}

   login(email: string, password: string) {
    return this.http.post(
      'http://localhost:8080/api/auth/login',
      { email, password },
      { withCredentials: true }
    ).pipe(
      tap(() => this.isAuthenticated.set(true))
    );
  }

  register(email: string, password: string) {
    return this.http.post(
      'http://localhost:8080/api/auth/register',
      { email, password },
      { withCredentials: true }
    ).pipe(
      tap(() => this.isAuthenticated.set(true))
    );
  }

  logout() {
    return this.http.post(
      'http://localhost:8080/api/auth/logout',
      {},
      { withCredentials: true }
    ).pipe(
      tap(() => this.isAuthenticated.set(false))
    );
  }

  checkAuth() {
    return this.http.get(
      'http://localhost:8080/api/auth/me',
      { withCredentials: true }
    );
  }
}
