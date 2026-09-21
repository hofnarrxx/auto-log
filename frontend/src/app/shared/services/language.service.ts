import { Injectable, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthStore } from '../../core/auth/auth-store';
import { NotificationService } from './notification.service';

export type AppLanguage = 'en' | 'pl';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly STORAGE_KEY = 'autolog-language';
  private readonly DEFAULT_LANGUAGE: AppLanguage = 'en';

  private readonly translate = inject(TranslateService);
  private readonly authStore = inject(AuthStore);
  private readonly notifications = inject(NotificationService);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  readonly selectedLanguage = signal<AppLanguage>(this.loadLanguage());

  applyCurrent(): void {
    this.translate.use(this.selectedLanguage());
  }

  setLanguage(language: string): void {
    const lang = this.parseLanguage(language);
    if (!lang) {
      return;
    }

    this.selectedLanguage.set(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);

    if (this.authStore.isDemo() && this.isInAppRoute()) {
      this.authStore.startDemo(lang).subscribe({
        next: () => this.assignGarage(),
        error: (err: HttpErrorResponse) => {
          this.translate.use(lang);
          if (err.status !== 429) {
            this.notifications.notifyError('demo.errors.startFailed');
          }
        },
      });
      return;
    }

    this.translate.use(lang);
  }

  private isInAppRoute(): boolean {
    const path = this.router.url.split('?')[0];
    return (
      path.startsWith('/garage') ||
      path.startsWith('/settings') ||
      path.startsWith('/vehicles') ||
      path.startsWith('/add-vehicle')
    );
  }

  private assignGarage(): void {
    this.document.defaultView?.location.assign('/garage');
  }

  private loadLanguage(): AppLanguage {
    return this.parseLanguage(localStorage.getItem(this.STORAGE_KEY)) ?? this.DEFAULT_LANGUAGE;
  }

  private parseLanguage(language: string | null | undefined): AppLanguage | null {
    return language === 'en' || language === 'pl' ? language : null;
  }
}
