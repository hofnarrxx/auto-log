import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { DateFormatPipe, MoneyPipe } from '../../../../shared/pipes';
import { CurrencyService } from '../../../../shared/services/currency.service';
import { formatFuelAmount, getFuelPricePerUnit } from '../../../../shared/utils/fuel-record.utils';
import {
  type FuelListRecord,
  type FuelSortOption,
  filterFuelRecords,
  sortFuelRecords,
} from '../../../../shared/utils/fuel-list.utils';
import { findMileageWarningRecordIds } from '../../../../shared/utils/mileage.utils';

@Component({
  selector: 'app-fuel-list',
  imports: [CommonModule, TranslateModule, LucideAngularModule, DateFormatPipe, MoneyPipe],
  templateUrl: './fuel-list.html',
  styleUrl: './fuel-list.css',
})
export class FuelList<T extends FuelListRecord> {
  private readonly currencyService = inject(CurrencyService);

  protected readonly fuelRecords = signal<T[]>([]);
  protected readonly gasStationSearch = signal('');
  protected readonly selectedSort = signal<FuelSortOption>('newest');
  protected readonly titleKeyPrefixValue = signal('vehicle.fuelTab');
  protected readonly showAddButtonValue = signal(false);
  protected readonly totalRecordsValue = signal(0);
  protected readonly totalCostTextValue = signal('');

  @Input()
  set records(value: T[]) {
    this.fuelRecords.set(value ?? []);
  }

  @Input()
  set titleKeyPrefix(value: string) {
    this.titleKeyPrefixValue.set(value || 'vehicle.fuelTab');
  }

  @Input()
  set showAddButton(value: boolean) {
    this.showAddButtonValue.set(value);
  }

  @Input()
  set totalRecords(value: number) {
    this.totalRecordsValue.set(value ?? 0);
  }

  @Input()
  set totalCostText(value: string) {
    this.totalCostTextValue.set(value ?? '');
  }

  @Output() recordSelected = new EventEmitter<T>();
  @Output() addRequested = new EventEmitter<void>();

  protected readonly hasAnyRecords = computed(() => this.fuelRecords().length > 0);
  protected readonly filteredFuelRecords = computed(() =>
    filterFuelRecords(this.fuelRecords(), this.gasStationSearch().trim())
  );
  protected readonly visibleFuelRecords = computed(() =>
    sortFuelRecords(this.filteredFuelRecords(), this.selectedSort())
  );
  protected readonly mileageWarningRecordIds = computed(() =>
    findMileageWarningRecordIds(this.fuelRecords(), (record) => record.date)
  );

  protected getTitleTranslationKey(postfix: string): string {
    return `${this.titleKeyPrefixValue()}.${postfix}`;
  }

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

  protected hasMileageWarning(record: T): boolean {
    return this.mileageWarningRecordIds().has(record.id);
  }

  protected onGasStationSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.gasStationSearch.set(value.trimStart());
  }

  protected onSortChange(event: Event) {
    const rawValue = (event.target as HTMLSelectElement).value;
    if (
      rawValue !== 'newest' &&
      rawValue !== 'oldest' &&
      rawValue !== 'price-low-high' &&
      rawValue !== 'price-high-low' &&
      rawValue !== 'price-per-unit-low-high' &&
      rawValue !== 'price-per-unit-high-low'
    ) {
      return;
    }

    this.selectedSort.set(rawValue);
  }

  protected openRecordDetails(record: T) {
    this.recordSelected.emit(record);
  }

  protected requestAdd() {
    this.addRequested.emit();
  }
}
