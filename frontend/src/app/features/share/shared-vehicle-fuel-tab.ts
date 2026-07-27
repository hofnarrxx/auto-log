import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DateFormatPipe, MoneyPipe } from '../../shared/pipes';
import { CurrencyService } from '../../shared/services/currency.service';
import { FuelListComponent } from '../../shared/ui/fuel-list/fuel-list.component';
import { formatFuelAmount, getFuelPricePerUnit } from '../../shared/utils/fuel-record.utils';
import { findMileageWarningRecordIds } from '../../shared/utils/mileage.utils';
import type { FuelRecord } from '../vehicle/models';

@Component({
  selector: 'app-shared-vehicle-fuel-tab',
  standalone: true,
  imports: [CommonModule, TranslateModule, FuelListComponent, DateFormatPipe, MoneyPipe],
  templateUrl: './shared-vehicle-fuel-tab.html',
  styleUrl: './shared-vehicle-fuel-tab.css',
})
export class SharedVehicleFuelTab {
  private readonly currencyService = inject(CurrencyService);

  @Input({ required: true })
  set records(value: FuelRecord[]) {
    this.fuelRecords.set(value ?? []);
  }

  protected readonly error = signal<string | null>(null);
  protected readonly isModalOpen = signal(false);
  protected readonly selectedRecord = signal<FuelRecord | null>(null);
  protected readonly fuelRecords = signal<FuelRecord[]>([]);
  protected readonly totalFuelCostByCurrency = computed(() => {
    const totals = new Map<string, number>();

    this.fuelRecords().forEach((record) => {
      if (record.cost === null) {
        return;
      }

      const currency = this.getRecordCurrency(record);
      totals.set(currency, (totals.get(currency) ?? 0) + record.cost);
    });

    return Array.from(totals.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([currency, total]) => this.currencyService.formatCurrency(total, currency))
      .join(' | ');
  });
  protected readonly mileageWarningRecordIds = computed(() =>
    findMileageWarningRecordIds(this.fuelRecords(), (record) => record.date)
  );

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

  protected hasMileageWarning(record: FuelRecord): boolean {
    return this.mileageWarningRecordIds().has(record.id);
  }

  protected openRecordDetails(record: FuelRecord) {
    this.selectedRecord.set(record);
    this.isModalOpen.set(true);
  }

  protected closeModal() {
    this.isModalOpen.set(false);
    this.selectedRecord.set(null);
  }

  private getRecordCurrency(record: FuelRecord): string {
    const fallbackCurrency = this.currencyService.selectedCurrency();
    return (record.currency || fallbackCurrency).trim().toUpperCase();
  }
}
