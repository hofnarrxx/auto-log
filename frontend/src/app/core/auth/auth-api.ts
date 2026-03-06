import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  isAuthenticated = signal<boolean>(false);

  constructor(private http: HttpClient) {
    this.checkAuth().subscribe({
      next: () => this.isAuthenticated.set(true),
      error: () => this.isAuthenticated.set(false)
    });
  }

  login(email: string, password: string) {
    return this.http.post(
      'http://localhost:8080/api/auth/login',
      { email, password }
    ).pipe(
      tap(() => this.isAuthenticated.set(true))
    );
  }

  register(email: string, password: string) {
    return this.http.post(
      'http://localhost:8080/api/auth/register',
      { email, password }
    ).pipe(
      tap(() => this.isAuthenticated.set(true))
    );
  }

  logout() {
    return this.http.post(
      'http://localhost:8080/api/auth/logout',
      {}
    ).pipe(
      tap(() => this.isAuthenticated.set(false))
    );
  }

  checkAuth() {
    return this.http.get(
      'http://localhost:8080/api/auth/me'
    );
  }
}
