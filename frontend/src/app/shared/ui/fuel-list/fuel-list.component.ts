import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyService } from '../../services/currency.service';
import {
  type FuelListRecord,
  type FuelSortOption,
  filterFuelRecords,
  findMileageWarningRecordIds,
  sortFuelRecords,
} from '../../utils/fuel-list.utils';

@Component({
  selector: 'app-fuel-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './fuel-list.component.html',
  styleUrl: './fuel-list.component.css',
})
export class FuelListComponent {
  private readonly currencyService = inject(CurrencyService);

  protected readonly fuelRecords = signal<FuelListRecord[]>([]);
  protected readonly gasStationSearch = signal('');
  protected readonly selectedSort = signal<FuelSortOption>('newest');
  protected readonly titleKeyPrefixValue = signal('vehicle.fuelTab');
  protected readonly showAddButtonValue = signal(false);
  protected readonly totalRecordsValue = signal(0);
  protected readonly totalCostTextValue = signal('');

  @Input()
  set records(value: FuelListRecord[]) {
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

  @Output() recordSelected = new EventEmitter<any>();
  @Output() addRequested = new EventEmitter<void>();

  protected readonly hasAnyRecords = computed(() => this.fuelRecords().length > 0);
  protected readonly filteredFuelRecords = computed(() =>
    filterFuelRecords(this.fuelRecords(), this.gasStationSearch().trim())
  );
  protected readonly visibleFuelRecords = computed(() =>
    sortFuelRecords([...this.filteredFuelRecords()], this.selectedSort())
  );
  protected readonly mileageWarningRecordIds = computed(() =>
    findMileageWarningRecordIds(this.fuelRecords(), record => record.date)
  );

  protected getTitleTranslationKey(postfix: string): string {
    return `${this.titleKeyPrefixValue()}.${postfix}`;
  }

  protected formatDate(date: string | null | undefined): string {
    if (!date) {
      return '-';
    }

    const [year, month, day] = date.split('-');
    if (!year || !month || !day) {
      return date;
    }

    return `${day}.${month}.${year}`;
  }

  protected formatMoney(value: number | null | undefined, currency?: string): string {
    if (value === null || value === undefined) {
      return '-';
    }

    const currencyCode = currency || this.currencyService.selectedCurrency();
    return this.currencyService.formatCurrency(value, currencyCode);
  }

  protected formatFuelAmount(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) {
      return '-';
    }

    return `${amount.toFixed(2)} L`;
  }

  protected formatPricePerLitre(
    cost: number | null | undefined,
    amount: number | null | undefined,
    currency?: string
  ): string {
    if (cost === null || cost === undefined || amount === null || amount === undefined || amount <= 0) {
      return '-';
    }

    const pricePerLitre = cost / amount;
    return `${this.formatMoney(pricePerLitre, currency)} / L`;
  }

  protected hasMileageWarning(record: FuelListRecord): boolean {
    return this.mileageWarningRecordIds().has(record.id);
  }

  protected onGasStationSearchChange(rawValue: string) {
    this.gasStationSearch.set(rawValue.trimStart());
  }

  protected onSortChange(rawValue: string) {
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

  protected openRecordDetails(record: FuelListRecord) {
    this.recordSelected.emit(record);
  }

  protected requestAdd() {
    this.addRequested.emit();
  }
}
