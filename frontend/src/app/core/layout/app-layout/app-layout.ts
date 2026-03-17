import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthApi } from '../../auth/auth-api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css',
})
export class AppLayout {
  private authApi = inject(AuthApi);
  private router = inject(Router);

  logout() {
    this.authApi.logout().subscribe({
      next: () => {
        this.router.navigate(['/login'], { replaceUrl: true });
      },
      error: () => {
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    });
  }
}
