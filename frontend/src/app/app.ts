import { Component, inject, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthApi } from './core/auth/auth-api';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'AutoLog';
  private authApi = inject(AuthApi);
  ngOnInit() {
    this.authApi.checkAuth().subscribe({
      next: () => this.authApi.isAuthenticated.set(true),
      error: () => this.authApi.isAuthenticated.set(false)
    });
  }
}
