import { Component, inject, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthApi } from './core/auth/auth-api';
import { ToastHost } from './shared/ui/toast/toast-host';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule, ToastHost],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'AutoLog';
  private translate = inject(TranslateService);
  private authApi = inject(AuthApi);

  constructor() {
    this.translate.addLangs(['pl', 'en']);
    this.translate.setFallbackLang('en');

    const savedLanguage = localStorage.getItem('autolog-language');
    const language = savedLanguage === 'pl' || savedLanguage === 'en' ? savedLanguage : 'en';

    this.translate.use(language);
  }

  ngOnInit() {
    if (window.location.pathname.startsWith('/share/')) {
      this.authApi.isAuthenticated.set(false);
      return;
    }

    this.authApi.checkAuth().subscribe({
      next: () => this.authApi.isAuthenticated.set(true),
      error: () => this.authApi.isAuthenticated.set(false)
    });
  }
}
