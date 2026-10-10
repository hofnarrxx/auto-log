import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStore } from '../../core/auth/auth-store';
import { CurrencyService } from '../../shared/services/currency.service';
import { LanguageService } from '../../core/i18n/language.service';
import { PasswordModal } from './password-modal/password-modal';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, PasswordModal],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private currencyService = inject(CurrencyService);
  private languageService = inject(LanguageService);
  private authStore = inject(AuthStore);

  selectedCurrency = this.currencyService.selectedCurrency;
  selectedLanguage = this.languageService.selectedLanguage;
  currencies = ['EUR', 'USD', 'PLN', 'UAH'];
  languages = [
    { code: 'en', label: 'English' },
    { code: 'pl', label: 'Polski' },
    { code: 'uk', label: 'Українська' },
  ];

  readonly isDemo = this.authStore.isDemo;
  /** True: the button changes the existing password. False (Google-only): sets a first one. */
  readonly hasLocalLogin = this.authStore.hasLocalLogin;
  readonly isPasswordModalOpen = signal(false);

  onCurrencyChange(currency: string) {
    this.currencyService.setSelectedCurrency(currency);
  }

  onLanguageChange(language: string) {
    this.languageService.setLanguage(language);
  }

  openPasswordModal() {
    this.isPasswordModalOpen.set(true);
  }

  closePasswordModal() {
    this.isPasswordModalOpen.set(false);
  }
}
