import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { AuthStore } from '../../core/auth/auth-store';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-landing',
  imports: [FormsModule, RouterLink, TranslateModule, LucideAngularModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  private readonly authStore = inject(AuthStore);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly isAuthenticated = this.authStore.isAuthenticated;

  selectedLanguage = this.translate.currentLang || this.translate.defaultLang || 'en';

  onLanguageChange(language: string) {
    if (language !== 'en' && language !== 'pl') {
      return;
    }

    this.selectedLanguage = language;
    localStorage.setItem('autolog-language', language);
    this.translate.use(language);
  }

  tryDemo() {
    this.authStore.startDemo().subscribe({
      next: () => this.router.navigate(['/garage']),
      error: (err: HttpErrorResponse) => {
        if (err.status === 429) return;
        this.notifications.notifyError('demo.errors.startFailed');
      },
    });
  }
}
