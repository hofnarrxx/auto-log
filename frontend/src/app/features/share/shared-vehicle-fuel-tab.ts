import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DateFormatPipe, MoneyPipe } from '../../shared/pipes';
import { CurrencyService } from '../../shared/services/currency.service';
import { FuelListComponent } from '../../shared/ui/fuel-list/fuel-list.component';
import type { FuelRecord } from '../vehicle/models';

type SortOption =
  | 'newest'
  | 'oldest'
  | 'price-low-high'
  | 'price-high-low'
  | 'price-per-unit-low-high'
  | 'price-per-unit-high-low';

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
  protected readonly gasStationSearch = signal('');
  protected readonly selectedSort = signal<SortOption>('newest');
  protected readonly hasAnyRecords = computed(() => this.fuelRecords().length > 0);
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
  protected readonly filteredFuelRecords = computed(() =>
    this.fuelRecords().filter((record) => this.matchesGasStationFilter(record))
  );
  protected readonly visibleFuelRecords = computed(() =>
    [...this.filteredFuelRecords()].sort((left, right) => this.compareRecords(left, right))
  );
  protected readonly mileageWarningRecordIds = computed(() =>
    this.findMileageWarningRecordIds(this.fuelRecords(), (record) => record.date)
  );

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
    if (
      cost === null ||
      cost === undefined ||
      amount === null ||
      amount === undefined ||
      amount <= 0
    ) {
      return '-';
    }

    const pricePerLitre = cost / amount;
    return `${this.currencyService.formatCurrency(pricePerLitre, currency)} / L`;
  }

  protected hasMileageWarning(record: FuelRecord): boolean {
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

  protected openRecordDetails(record: FuelRecord) {
    this.selectedRecord.set(record);
    this.isModalOpen.set(true);
  }

  protected closeModal() {
    this.isModalOpen.set(false);
    this.selectedRecord.set(null);
  }

  private matchesGasStationFilter(record: FuelRecord): boolean {
    const query = this.gasStationSearch().trim().toLowerCase();
    if (!query) {
      return true;
    }

    const station = (record.gasStation ?? '').toLowerCase();
    return station.includes(query);
  }

  private compareRecords(left: FuelRecord, right: FuelRecord): number {
    const sort = this.selectedSort();

    if (sort === 'oldest') {
      return this.toTimestamp(left.date) - this.toTimestamp(right.date);
    }

    if (sort === 'price-low-high') {
      return (
        this.compareNullableNumbers(left.cost, right.cost, 'asc') ||
        this.toTimestamp(right.date) - this.toTimestamp(left.date)
      );
    }

    if (sort === 'price-high-low') {
      return (
        this.compareNullableNumbers(left.cost, right.cost, 'desc') ||
        this.toTimestamp(right.date) - this.toTimestamp(left.date)
      );
    }

    if (sort === 'price-per-unit-low-high') {
      return (
        this.compareNullableNumbers(this.pricePerUnit(left), this.pricePerUnit(right), 'asc') ||
        this.toTimestamp(right.date) - this.toTimestamp(left.date)
      );
    }

    if (sort === 'price-per-unit-high-low') {
      return (
        this.compareNullableNumbers(this.pricePerUnit(left), this.pricePerUnit(right), 'desc') ||
        this.toTimestamp(right.date) - this.toTimestamp(left.date)
      );
    }

    return this.toTimestamp(right.date) - this.toTimestamp(left.date);
  }

  private compareNullableNumbers(
    left: number | null,
    right: number | null,
    direction: 'asc' | 'desc'
  ): number {
    if (left === null && right === null) {
      return 0;
    }

    if (left === null) {
      return 1;
    }

    if (right === null) {
      return -1;
    }

    return direction === 'asc' ? left - right : right - left;
  }

  private pricePerUnit(record: FuelRecord): number | null {
    if (record.cost === null || record.amount === null || record.amount <= 0) {
      return null;
    }

    return record.cost / record.amount;
  }

  private getRecordCurrency(record: FuelRecord): string {
    const fallbackCurrency = this.currencyService.selectedCurrency();
    return (record.currency || fallbackCurrency).trim().toUpperCase();
  }

  private findMileageWarningRecordIds<T extends { id: number; mileage: number | null }>(
    records: T[],
    getDate: (record: T) => string
  ): Set<number> {
    const sorted = [...records].sort(
      (left, right) => this.toTimestamp(getDate(left)) - this.toTimestamp(getDate(right))
    );

    const warnings = new Set<number>();
    let maxMileageSeen: number | null = null;

    sorted.forEach((record) => {
      const mileage = record.mileage;
      if (mileage === null) {
        return;
      }

      if (maxMileageSeen !== null && mileage < maxMileageSeen) {
        warnings.add(record.id);
        return;
      }

      maxMileageSeen = maxMileageSeen === null ? mileage : Math.max(maxMileageSeen, mileage);
    });

    return warnings;
  }

  private toTimestamp(date: string): number {
    const timestamp = new Date(`${date}T00:00:00`).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }
}
