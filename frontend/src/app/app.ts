import { Component, inject } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthStore } from './core/auth/auth-store';
import { LanguageService } from './shared/services/language.service';
import { ToastHost } from './shared/ui/toast/toast-host';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule, ToastHost],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'AutoLog';
  private translate = inject(TranslateService);
  private authStore = inject(AuthStore);
  private languageService = inject(LanguageService);

  constructor() {
    this.translate.addLangs(['pl', 'en']);
    this.translate.setFallbackLang('en');
    this.languageService.applyCurrent();
  }

  ngOnInit() {
    if (window.location.pathname.startsWith('/share/')) {
      this.authStore.markUnauthenticated();
      return;
    }

    this.authStore.checkAuth().subscribe({
      error: () => this.authStore.markUnauthenticated(),
    });
  }
}
