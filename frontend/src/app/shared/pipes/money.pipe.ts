import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyService } from '../services/currency.service';

@Pipe({
  name: 'money',
  standalone: true,
  pure: false,
})
export class MoneyPipe implements PipeTransform {
  private readonly currencyService = inject(CurrencyService);

  transform(value: number | null | undefined, currency?: string): string {
    return this.currencyService.formatCurrency(value, currency);
  }
}
