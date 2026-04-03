import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  private readonly STORAGE_KEY = 'selectedCurrency';
  private readonly DEFAULT_CURRENCY = 'EUR';

  readonly selectedCurrency = signal<string>(this.loadCurrency());

  constructor() {
    // Load initial currency from storage
  }

  setSelectedCurrency(currency: string): void {
    this.selectedCurrency.set(currency);
    localStorage.setItem(this.STORAGE_KEY, currency);
  }

  private loadCurrency(): string {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored || this.DEFAULT_CURRENCY;
  }

  formatCurrency(value: number | null | undefined, currency?: string): string {
    if (value === null || value === undefined) {
      return '-';
    }

    const currencyCode = currency || this.selectedCurrency();
    const amount = new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);

    return `${amount} ${currencyCode}`;
  }
}
