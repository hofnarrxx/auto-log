import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { AuthStore } from '../../core/auth/auth-store';

// Real demo target is not live yet; swap this constant once the demo environment exists.
const DEMO_URL = '#';

@Component({
  selector: 'app-landing',
  imports: [FormsModule, RouterLink, TranslateModule, LucideAngularModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  private readonly authStore = inject(AuthStore);
  private readonly translate = inject(TranslateService);

  readonly isAuthenticated = this.authStore.isAuthenticated;
  readonly demoUrl = DEMO_URL;

  selectedLanguage = this.translate.currentLang || this.translate.defaultLang || 'en';

  onLanguageChange(language: string) {
    if (language !== 'en' && language !== 'pl') {
      return;
    }

    this.selectedLanguage = language;
    localStorage.setItem('autolog-language', language);
    this.translate.use(language);
  }
}
