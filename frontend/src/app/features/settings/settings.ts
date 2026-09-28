import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyService } from '../../shared/services/currency.service';
import { LanguageService } from '../../core/i18n/language.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private currencyService = inject(CurrencyService);
  private languageService = inject(LanguageService);

  selectedCurrency = this.currencyService.selectedCurrency;
  selectedLanguage = this.languageService.selectedLanguage;
  currencies = ['EUR', 'USD', 'PLN', 'UAH'];
  languages = [
    { code: 'en', label: 'English' },
    { code: 'pl', label: 'Polski' },
    { code: 'ua', label: 'Українська' },
  ];

  onCurrencyChange(currency: string) {
    this.currencyService.setSelectedCurrency(currency);
  }

  onLanguageChange(language: string) {
    this.languageService.setLanguage(language);
  }
}
