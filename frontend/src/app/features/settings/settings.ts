import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrencyService } from '../../shared/services/currency.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private currencyService = inject(CurrencyService);
  private translate = inject(TranslateService);

  selectedCurrency = this.currencyService.selectedCurrency;
  selectedLanguage = this.translate.currentLang || this.translate.defaultLang || 'en';
  currencies = ['EUR', 'USD', 'PLN'];
  languages = [
    { code: 'en', labelKey: 'settings.languages.en' },
    { code: 'pl', labelKey: 'settings.languages.pl' },
  ];

  onCurrencyChange(currency: string) {
    this.currencyService.setSelectedCurrency(currency);
  }

  onLanguageChange(language: string) {
    if (language !== 'en' && language !== 'pl') {
      return;
    }

    this.selectedLanguage = language;
    localStorage.setItem('autolog-language', language);
    this.translate.use(language);
  }
}
