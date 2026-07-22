import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { CurrencyService } from '../../services/currency.service';
import {
  getMaintenanceCategoryIcon,
  getMaintenanceCategoryLabel,
  getMaintenanceTimelineEntries,
  getMaintenanceWarningRecordIds,
  formatMaintenanceDate,
  type MaintenanceFilterState,
  type MaintenanceListRecord,
  type MaintenanceSortOption,
} from '../../../shared/utils/maintenance-list.utils';

@Component({
  selector: 'app-maintenance-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, LucideAngularModule],
  templateUrl: './maintenance-list.component.html',
  styleUrl: './maintenance-list.component.css',
})
export class MaintenanceListComponent<T extends MaintenanceListRecord> {
  private readonly currencyService = inject(CurrencyService);

  protected readonly allCurrenciesOption = 'All';

  @Input() set records(value: T[]) {
    this.serviceRecords.set(value ?? []);
    this.ensureFilterDefaults();
  }

  @Input() titleKeyPrefix: string = 'vehicle.maintenanceTab';
  @Input() showAddButton = false;
  @Input() showEmptyState = true;

  @Output() recordSelected = new EventEmitter<T>();
  @Output() filterOpened = new EventEmitter<void>();
  @Output() addRequested = new EventEmitter<void>();

  protected readonly availableFilterCategories = computed(() => {
    const unique = new Set<string>(this.serviceRecords().map(record => record.category));
    return Array.from(unique);
  });

  protected readonly selectedCategories = signal<string[]>([]);
  protected readonly minPriceLimit = signal(0);
  protected readonly maxPriceLimit = signal(0);
  protected readonly selectedCurrencyFilter = signal(this.allCurrenciesOption);
  protected readonly selectedSort = signal<MaintenanceSortOption>('newest');
  protected readonly titleSearch = signal('');
  protected readonly isFilterModalOpen = signal(false);
  protected readonly selectedRecord = signal<T | null>(null);
  protected readonly serviceRecords = signal<T[]>([]);
  private filtersInitialized = false;

  protected readonly allCategoriesChecked = computed(() => {
    const categories = this.availableFilterCategories();
    if (!categories.length) {
      return true;
    }

    const selected = new Set(this.selectedCategories());
    return categories.every(category => selected.has(category));
  });

  protected readonly hasAnyRecords = computed(() => this.serviceRecords().length > 0);
  protected readonly totalRecords = computed(() => this.serviceRecords().length);
  protected readonly timelineEntries = computed(() => {
    const filters: MaintenanceFilterState = {
      selectedCategories: this.selectedCategories(),
      selectedCurrencyFilter: this.selectedCurrencyFilter(),
      minPriceLimit: this.minPriceLimit(),
      maxPriceLimit: this.maxPriceLimit(),
      selectedSort: this.selectedSort(),
      titleSearch: this.titleSearch(),
    };

    return getMaintenanceTimelineEntries(this.serviceRecords(), filters, record => this.getRecordCurrency(record));
  });

  protected readonly mileageWarningRecordIds = computed(() =>
    getMaintenanceWarningRecordIds(this.serviceRecords(), record => record.serviceDate)
  );

  protected readonly maxAvailablePrice = computed(() => {
    const costs = this.getRecordsForSelectedCurrencyFilter()
      .map(record => record.cost)
      .filter((cost): cost is number => cost !== null);

    if (!costs.length) {
      return 0;
    }

    return Math.ceil(Math.max(...costs));
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

  protected openRecordDetails(record: T) {
    this.closeFilterModal();
    this.selectedRecord.set(record);
    this.recordSelected.emit(record);
  }

  protected openFilterModal() {
    this.ensureFilterDefaults();
    this.isFilterModalOpen.set(true);
    this.filterOpened.emit();
  }

  protected closeFilterModal() {
    this.isFilterModalOpen.set(false);
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

    this.selectedCategories.set(this.selectedCategories().filter(selectedCategory => selectedCategory !== category));
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
    const selected = rawValue === this.allCurrenciesOption || available.includes(rawValue) ? rawValue : this.allCurrenciesOption;

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
    if (rawValue !== 'newest' && rawValue !== 'oldest' && rawValue !== 'price-low-high' && rawValue !== 'price-high-low') {
      return;
    }

    this.selectedSort.set(rawValue);
  }

  protected onTitleSearchChange(rawValue: string) {
    this.titleSearch.set(rawValue.trimStart());
  }

  protected categoryLabel(category: string): string {
    return getMaintenanceCategoryLabel(category);
  }

  protected iconForCategory(category: string): string {
    return getMaintenanceCategoryIcon(category);
  }

  protected formatDate(serviceDate: string): string {
    return formatMaintenanceDate(serviceDate);
  }

  protected formatMoney(value: number | null, currency?: string): string {
    if (value === null || value === undefined) {
      return '-';
    }

    const currencyCode = currency || this.currencyService.selectedCurrency();
    return this.currencyService.formatCurrency(value, currencyCode);
  }

  protected hasMileageWarning(record: T): boolean {
    return this.mileageWarningRecordIds().has(record.id);
  }

  protected requestAdd() {
    this.addRequested.emit();
  }

  protected getTitleTranslationKey(translationKey: string): string {
    return `${this.titleKeyPrefix}.${translationKey}`;
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

    const selected = this.selectedCategories().filter(category => availableCategories.includes(category));
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

  private getRecordsForSelectedCurrencyFilter(): T[] {
    const selectedCurrency = this.selectedCurrencyFilter();
    if (selectedCurrency === this.allCurrenciesOption) {
      return this.serviceRecords();
    }

    return this.serviceRecords().filter(record => this.getRecordCurrency(record) === selectedCurrency);
  }

  private getRecordCurrency(record: T): string {
    const fallbackCurrency = this.currencyService.selectedCurrency();
    return (record.currency || fallbackCurrency).trim().toUpperCase();
  }
}
