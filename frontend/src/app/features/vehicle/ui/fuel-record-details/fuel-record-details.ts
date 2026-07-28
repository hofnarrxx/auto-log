import { Component, Input, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DateFormatPipe, MoneyPipe } from '../../../../shared/pipes';
import { CurrencyService } from '../../../../shared/services/currency.service';
import { formatFuelAmount, getFuelPricePerUnit } from '../../../../shared/utils/fuel-record.utils';
import type { FuelRecord } from '../../models';

/**
 * Read-only fuel record view, reused by the authenticated fuel tab's details modal and the
 * public share fuel tab.
 */
@Component({
  selector: 'app-fuel-record-details',
  imports: [TranslateModule, DateFormatPipe, MoneyPipe],
  templateUrl: './fuel-record-details.html',
  styleUrl: './fuel-record-details.css',
})
export class FuelRecordDetails {
  private readonly currencyService = inject(CurrencyService);

  @Input({ required: true }) record!: FuelRecord;
  @Input() hasMileageWarning = false;

  protected formatFuelAmount(amount: number | null | undefined): string {
    return formatFuelAmount(amount);
  }

  protected formatPricePerLitre(
    cost: number | null | undefined,
    amount: number | null | undefined,
    currency?: string
  ): string {
    const pricePerLitre = getFuelPricePerUnit({ cost: cost ?? null, amount: amount ?? null });

    if (pricePerLitre === null) {
      return '-';
    }

    return `${this.currencyService.formatCurrency(pricePerLitre, currency)} / L`;
  }
}
