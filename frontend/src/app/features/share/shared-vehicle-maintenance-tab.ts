import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyService } from '../../shared/services/currency.service';
import type { SharedMaintenanceEntry } from './shared-vehicle-model';

type SortOption = 'newest' | 'oldest' | 'price-low-high' | 'price-high-low';

@Component({
  selector: 'app-shared-vehicle-maintenance-tab',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './shared-vehicle-maintenance-tab.html',
  styleUrl: './shared-vehicle-maintenance-tab.css',
})
export class SharedVehicleMaintenanceTab {
  protected readonly allCurrenciesOption = 'All';

  private readonly currencyService = inject(CurrencyService);

  @Input({ required: true })
  set records(value: SharedMaintenanceEntry[]) {
    this.serviceRecords.set(value ?? []);
    this.ensureFilterDefaults();
  }

  protected readonly error = signal<string | null>(null);
  protected readonly isFilterModalOpen = signal(false);
  protected readonly isModalOpen = signal(false);
  protected readonly selectedRecord = signal<SharedMaintenanceEntry | null>(null);
  protected readonly selectedCategories = signal<string[]>([]);
  protected readonly minPriceLimit = signal(0);
  protected readonly maxPriceLimit = signal(0);
  protected readonly selectedCurrencyFilter = signal(this.allCurrenciesOption);
  protected readonly selectedSort = signal<SortOption>('newest');
  protected readonly titleSearch = signal('');

  private readonly serviceRecords = signal<SharedMaintenanceEntry[]>([]);
  private filtersInitialized = false;

  protected readonly availableFilterCategories = computed(() => {
    const unique = new Set<string>(this.serviceRecords().map(record => record.category));
    return Array.from(unique);
  });

  protected readonly maxAvailablePrice = computed(() => {
    const costs = this.getRecordsForSelectedCurrencyFilter()
      .map(record => record.cost)
      .filter((cost): cost is number => cost !== null);

    if (!costs.length) {
      return 0;
    }

    return Math.ceil(Math.max(...costs));
  });

  protected readonly allCategoriesChecked = computed(() => {
    const categories = this.availableFilterCategories();
    if (!categories.length) {
      return true;
    }

    const selected = new Set(this.selectedCategories());
    return categories.every(category => selected.has(category));
  });

  protected readonly availableFilterCurrencies = computed(() => {
    const unique = new Set<string>(
      this.serviceRecords()
        .map(record => this.getRecordCurrency(record))
        .filter(currency => !!currency)
    );

    const selected = this.selectedCurrencyFilter();
    if (selected !== this.allCurrenciesOption) {
      unique.add(selected);
    }

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  });

  protected readonly hasAnyRecords = computed(() => this.serviceRecords().length > 0);
  protected readonly totalRecords = computed(() => this.serviceRecords().length);
  protected readonly totalServiceCostByCurrency = computed(() => {
    const totals = new Map<string, number>();

    this.serviceRecords().forEach(record => {
      if (record.cost === null) {
        return;
      }

      const currency = this.getRecordCurrency(record);
      totals.set(currency, (totals.get(currency) ?? 0) + record.cost);
    });

    return Array.from(totals.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([currency, total]) => this.formatMoney(total, currency))
      .join(' | ');
  });

  protected readonly timelineEntries = computed(() =>
    [...this.serviceRecords()]
      .filter(
        record =>
          this.matchesCategoryFilter(record) &&
          this.matchesPriceFilter(record) &&
          this.matchesTitleFilter(record)
      )
      .sort((a, b) => this.compareRecords(a, b))
  );

  protected readonly mileageWarningRecordIds = computed(() =>
    this.findMileageWarningRecordIds(this.serviceRecords(), record => record.serviceDate)
  );

  protected readonly sliderTrackStyle = computed(() => {
    const max = this.maxAvailablePrice();
    const range = max || 1;

    const startPercent = (this.minPriceLimit() / range) * 100;
    const endPercent = (this.maxPriceLimit() / range) * 100;

    return {
      '--track-start': `${Math.max(0, Math.min(100, startPercent))}%`,
      '--track-end': `${Math.max(0, Math.min(100, endPercent))}%`,
    };
  });

  protected openRecordDetails(record: SharedMaintenanceEntry) {
    this.closeFilterModal();
    this.selectedRecord.set(record);
    this.isModalOpen.set(true);
  }

  protected openFilterModal() {
    this.ensureFilterDefaults();
    this.isFilterModalOpen.set(true);
  }

  protected closeFilterModal() {
    this.isFilterModalOpen.set(false);
  }

  protected closeModal() {
    this.isModalOpen.set(false);
    this.selectedRecord.set(null);
  }

  protected toggleAllCategories(checked: boolean) {
    if (checked) {
      this.selectedCategories.set([...this.availableFilterCategories()]);
      return;
    }

    this.selectedCategories.set([]);
  }

  protected isCategorySelected(category: string): boolean {
    return this.selectedCategories().includes(category);
  }

  protected toggleCategory(category: string, checked: boolean) {
    if (checked) {
      this.selectedCategories.set([...this.selectedCategories(), category]);
      return;
    }

    this.selectedCategories.set(
      this.selectedCategories().filter(selectedCategory => selectedCategory !== category)
    );
  }

  protected onMinPriceLimitChange(rawValue: string) {
    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) {
      return;
    }

    const bounded = Math.max(0, parsed);
    this.minPriceLimit.set(Math.min(bounded, this.maxPriceLimit()));
  }

  protected onMaxPriceLimitChange(rawValue: string) {
    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) {
      return;
    }

    const bounded = Math.min(this.maxAvailablePrice(), parsed);
    this.maxPriceLimit.set(Math.max(bounded, this.minPriceLimit()));
  }

  protected onCurrencyFilterChange(rawValue: string) {
    const available = this.availableFilterCurrencies();
    const selected =
      rawValue === this.allCurrenciesOption || available.includes(rawValue)
        ? rawValue
        : this.allCurrenciesOption;

    this.selectedCurrencyFilter.set(selected);
    this.minPriceLimit.set(0);
    this.maxPriceLimit.set(this.maxAvailablePrice());
  }

  protected resetFilters() {
    this.selectedCategories.set([...this.availableFilterCategories()]);
    this.selectedCurrencyFilter.set(this.allCurrenciesOption);
    this.minPriceLimit.set(0);
    this.maxPriceLimit.set(this.maxAvailablePrice());
  }

  protected onSortChange(rawValue: string) {
    if (
      rawValue !== 'newest' &&
      rawValue !== 'oldest' &&
      rawValue !== 'price-low-high' &&
      rawValue !== 'price-high-low'
    ) {
      return;
    }

    this.selectedSort.set(rawValue);
  }

  protected onTitleSearchChange(rawValue: string) {
    this.titleSearch.set(rawValue.trimStart());
  }

  protected categoryLabel(category: string): string {
    switch (category.trim().toLowerCase()) {
      case 'inspection':
        return 'vehicle.maintenanceTab.categories.inspection';
      case 'oil change':
        return 'vehicle.maintenanceTab.categories.oilChange';
      case 'repair':
        return 'vehicle.maintenanceTab.categories.repair';
      case 'part replacement':
        return 'vehicle.maintenanceTab.categories.partReplacement';
      case 'fluid refill':
        return 'vehicle.maintenanceTab.categories.fluidRefill';
      case 'tires & wheels':
        return 'vehicle.maintenanceTab.categories.tiresAndWheels';
      case 'cosmetic':
        return 'vehicle.maintenanceTab.categories.cosmetic';
      default:
        return category;
    }
  }

  protected formatMoney(value: number | null, currency?: string): string {
    if (value === null || value === undefined) {
      return '-';
    }
    const currencyCode = currency || this.currencyService.selectedCurrency();
    return this.currencyService.formatCurrency(value, currencyCode);
  }

  protected formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return isoString;
    }

    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = `${date.getFullYear()}`;
    const hour = `${date.getHours()}`.padStart(2, '0');
    const minute = `${date.getMinutes()}`.padStart(2, '0');

    return `${day}.${month}.${year} ${hour}:${minute}`;
  }

  protected formatDate(serviceDate: string): string {
    const [year, month, day] = serviceDate.split('-');
    if (!year || !month || !day) {
      return serviceDate;
    }
    return `${day}.${month}.${year}`;
  }

  protected iconForCategory(category: string): string {
    const normalizedCategory = category.trim().toLowerCase();
    const iconMap: Record<string, string> = {
      inspection: '🔍',
      'oil change': '🛢️',
      repair: '🔧',
      'part replacement': '⚙️',
      'fluid refill': '💧',
      'tires & wheels': '🛞',
      cosmetic: '✨',
    };

    return iconMap[normalizedCategory] ?? '🧰';
  }

  protected hasMileageWarning(record: SharedMaintenanceEntry): boolean {
    return this.mileageWarningRecordIds().has(record.id);
  }

  private toTimestamp(serviceDate: string): number {
    const timestamp = new Date(`${serviceDate}T00:00:00`).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private ensureFilterDefaults() {
    const availableCategories = this.availableFilterCategories();
    const maxPrice = this.maxAvailablePrice();

    if (!this.filtersInitialized) {
      this.selectedCategories.set([...availableCategories]);
      this.minPriceLimit.set(0);
      this.maxPriceLimit.set(maxPrice);
      this.filtersInitialized = true;
      return;
    }

    const selected = this.selectedCategories().filter(category =>
      availableCategories.includes(category)
    );

    this.selectedCategories.set(selected);

    if (this.minPriceLimit() === 0 && this.maxPriceLimit() === 0 && maxPrice > 0) {
      this.maxPriceLimit.set(maxPrice);
    }

    if (this.maxPriceLimit() > maxPrice) {
      this.maxPriceLimit.set(maxPrice);
    }

    if (this.minPriceLimit() < 0) {
      this.minPriceLimit.set(0);
    }

    if (this.minPriceLimit() > this.maxPriceLimit()) {
      this.minPriceLimit.set(this.maxPriceLimit());
    }
  }

  private matchesCategoryFilter(record: SharedMaintenanceEntry): boolean {
    const selectedCategories = this.selectedCategories();

    if (!selectedCategories.length) {
      return false;
    }

    return selectedCategories.includes(record.category);
  }

  private matchesPriceFilter(record: SharedMaintenanceEntry): boolean {
    const selectedCurrency = this.selectedCurrencyFilter();
    const recordCurrency = this.getRecordCurrency(record);

    if (selectedCurrency !== this.allCurrenciesOption && recordCurrency !== selectedCurrency) {
      return false;
    }

    if (record.cost === null) {
      return selectedCurrency === this.allCurrenciesOption;
    }

    return record.cost >= this.minPriceLimit() && record.cost <= this.maxPriceLimit();
  }

  private getRecordsForSelectedCurrencyFilter(): SharedMaintenanceEntry[] {
    const selectedCurrency = this.selectedCurrencyFilter();
    if (selectedCurrency === this.allCurrenciesOption) {
      return this.serviceRecords();
    }

    return this.serviceRecords().filter(record => this.getRecordCurrency(record) === selectedCurrency);
  }

  private getRecordCurrency(record: SharedMaintenanceEntry): string {
    const fallbackCurrency = this.currencyService.selectedCurrency();
    return (record.currency || fallbackCurrency).trim().toUpperCase();
  }

  private matchesTitleFilter(record: SharedMaintenanceEntry): boolean {
    const query = this.titleSearch().trim().toLowerCase();
    if (!query) {
      return true;
    }

    const title = (record.title ?? '').toLowerCase();
    return title.includes(query);
  }

  private compareRecords(a: SharedMaintenanceEntry, b: SharedMaintenanceEntry): number {
    const sort = this.selectedSort();

    if (sort === 'oldest') {
      return this.toTimestamp(a.serviceDate) - this.toTimestamp(b.serviceDate);
    }

    if (sort === 'price-low-high') {
      return this.compareByPrice(a, b, 'asc');
    }

    if (sort === 'price-high-low') {
      return this.compareByPrice(a, b, 'desc');
    }

    return this.toTimestamp(b.serviceDate) - this.toTimestamp(a.serviceDate);
  }

  private compareByPrice(a: SharedMaintenanceEntry, b: SharedMaintenanceEntry, direction: 'asc' | 'desc'): number {
    const left = a.cost ?? Number.POSITIVE_INFINITY;
    const right = b.cost ?? Number.POSITIVE_INFINITY;

    if (left !== right) {
      return direction === 'asc' ? left - right : right - left;
    }

    return this.toTimestamp(b.serviceDate) - this.toTimestamp(a.serviceDate);
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

    sorted.forEach(record => {
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
}
