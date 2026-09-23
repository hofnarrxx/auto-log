import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { AuthStore } from '../../core/auth/auth-store';
import { LanguageService } from '../../core/i18n/language.service';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-landing',
  imports: [FormsModule, RouterLink, TranslateModule, LucideAngularModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  private readonly authStore = inject(AuthStore);
  private readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly isAuthenticated = this.authStore.isAuthenticated;
  readonly isDemo = this.authStore.isDemo;
  readonly selectedLanguage = this.languageService.selectedLanguage;

  onLanguageChange(language: string) {
    this.languageService.setLanguage(language);
  }

  tryDemo() {
    this.authStore.startDemo(this.selectedLanguage()).subscribe({
      next: () => this.router.navigate(['/garage']),
      error: (err: HttpErrorResponse) => {
        if (err.status === 429) return;
        this.notifications.notifyError('demo.errors.startFailed');
      },
    });
  }
}
