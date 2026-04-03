import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyService } from '../../shared/services/currency.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings {
  private currencyService = inject(CurrencyService);
  
  selectedCurrency = this.currencyService.selectedCurrency;
  currencies = ['EUR', 'USD', 'PLN'];

  onCurrencyChange(currency: string) {
    this.currencyService.setSelectedCurrency(currency);
  }
}
