import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyService } from '../../shared/services/currency.service';
import { LanguageService } from '../../shared/services/language.service';

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
  currencies = ['EUR', 'USD', 'PLN'];
  languages = [
    { code: 'en', labelKey: 'settings.languages.en' },
    { code: 'pl', labelKey: 'settings.languages.pl' },
  ];

  onCurrencyChange(currency: string) {
    this.currencyService.setSelectedCurrency(currency);
  }

  onLanguageChange(language: string) {
    this.languageService.setLanguage(language);
  }
}
