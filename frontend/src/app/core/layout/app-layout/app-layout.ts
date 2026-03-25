import { Component, inject, HostListener, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthApi } from '../../auth/auth-api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-app-layout',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css',
})
export class AppLayout {
  private authApi = inject(AuthApi);
  private router = inject(Router);
  menuOpen = signal(false);

  isVehicleDashboardPage() {
    return /^\/vehicles\/\d+(\?.*)?$/.test(this.router.url);
  }

  currentVehicleId() {
    const match = this.router.url.match(/^\/vehicles\/(\d+)/);
    return match?.[1] ?? null;
  }

  isVehicleTabActive(tab: 'details' | 'maintenance') {
    if (!this.isVehicleDashboardPage()) {
      return false;
    }

    const queryTab = this.router.parseUrl(this.router.url).queryParams['tab'];
    if (!queryTab) {
      return tab === 'details';
    }
    return queryTab === tab;
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen.update(v => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.menuOpen.set(false);
  }

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
