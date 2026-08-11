import { Component, inject, HostListener, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStore } from '../../auth/auth-store';
import { Router } from '@angular/router';

@Component({
  selector: 'app-app-layout',
  imports: [RouterOutlet, RouterLink, TranslateModule],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css',
})
export class AppLayout {
  private authStore = inject(AuthStore);
  private router = inject(Router);
  menuOpen = signal(false);

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen.update((v) => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.menuOpen.set(false);
  }

  logout() {
    this.authStore.logout().subscribe({
      next: () => {
        this.router.navigate(['/login'], { replaceUrl: true });
      },
      error: () => {
        this.router.navigate(['/login'], { replaceUrl: true });
      },
    });
  }
}
