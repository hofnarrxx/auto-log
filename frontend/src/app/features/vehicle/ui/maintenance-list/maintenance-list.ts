import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  CategoryIconPipe,
  CategoryLabelPipe,
  DateFormatPipe,
  MoneyPipe,
} from '../../../../shared/pipes';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import type {
  MaintenanceListRecord,
  MaintenanceSortOption,
} from '../../../../shared/utils/maintenance-list.utils';
import { Modal } from '../../../../shared/ui/modal/modal';

export const ALL_CURRENCIES = '';

/** Fixed set of currencies the app supports; mirrors the create/edit form's hardcoded options. */
export const AVAILABLE_CURRENCIES = ['EUR', 'USD', 'PLN'];

export interface MaintenanceQueryChange {
  title: string;
  sort: MaintenanceSortOption;
  categories: string[] | undefined;
  currency: string;
  minCost: number | null;
  maxCost: number | null;
}

/**
 * Controlled maintenance-record timeline: the parent owns the query (search/sort/filters), the
 * page and the mileage-warning set (all derived from server state). The filter modal keeps its
 * own local draft signals for a responsive UI, but reports every change through `queryChange`
 * instead of filtering in-memory.
 */
@Component({
  selector: 'app-maintenance-list',
  imports: [
    CommonModule,
    TranslateModule,
    LucideAngularModule,
    Modal,
    CategoryIconPipe,
    CategoryLabelPipe,
    DateFormatPipe,
    MoneyPipe,
    Pagination,
  ],
  templateUrl: './maintenance-list.html',
  styleUrl: './maintenance-list.css',
})
export class MaintenanceList<T extends MaintenanceListRecord> {
  private readonly destroyRef = inject(DestroyRef);
  private readonly titleSearchInput$ = new Subject<string>();
  private readonly priceRangeInput$ = new Subject<void>();
  // `availableCategories` and `maxAvailablePrice` load independently (separate async calls) and
  // may arrive in either order. Rather than trying to detect "both have loaded" (which is prone
  // to races - one can arrive while the other is still at its unset default), we keep each
  // filter's defaults in sync with its own input until the user manually touches that filter.
  private categoriesTouchedByUser = false;
  private priceRangeTouchedByUser = false;

  protected readonly allCurrenciesOption = ALL_CURRENCIES;
  protected readonly availableCurrencies = AVAILABLE_CURRENCIES;

  protected readonly serviceRecords = signal<T[]>([]);
  protected readonly titleKeyPrefixValue = signal('vehicle.maintenanceTab');
  protected readonly showAddButtonValue = signal(false);
  protected readonly totalRecordsValue = signal(0);
  protected readonly totalCostTextValue = signal('');
  protected readonly mileageWarningRecordIdsValue = signal<ReadonlySet<number>>(new Set());
  protected readonly availableCategoriesValue = signal<string[]>([]);
  protected readonly maxAvailablePriceValue = signal(0);
  protected readonly pageValue = signal(0);
  protected readonly sizeValue = signal(20);
  protected readonly totalPagesValue = signal(0);
  protected readonly totalElementsValue = signal(0);

  protected readonly selectedCategories = signal<string[]>([]);
  protected readonly minPriceLimit = signal(0);
  protected readonly maxPriceLimit = signal(0);
  protected readonly selectedCurrencyFilter = signal(ALL_CURRENCIES);
  protected readonly selectedSort = signal<MaintenanceSortOption>('newest');
  protected readonly titleSearch = signal('');
  protected readonly isFilterModalOpen = signal(false);

  @Input() set records(value: T[]) {
    this.serviceRecords.set(value ?? []);
  }

  @Input() set titleKeyPrefix(value: string) {
    this.titleKeyPrefixValue.set(value || 'vehicle.maintenanceTab');
  }

  @Input() set showAddButton(value: boolean) {
    this.showAddButtonValue.set(value);
  }

  @Input() set totalRecords(value: number) {
    this.totalRecordsValue.set(value ?? 0);
  }

  @Input() set totalCostText(value: string) {
    this.totalCostTextValue.set(value ?? '');
  }

  @Input() set mileageWarningRecordIds(value: ReadonlySet<number>) {
    this.mileageWarningRecordIdsValue.set(value ?? new Set());
  }

  @Input() set availableCategories(value: string[]) {
    this.availableCategoriesValue.set(value ?? []);
    this.syncCategoryDefaults();
  }

  @Input() set maxAvailablePrice(value: number) {
    this.maxAvailablePriceValue.set(value ?? 0);
    this.syncPriceRangeDefaults();
  }

  @Input() set search(value: string) {
    this.titleSearch.set(value ?? '');
  }

  @Input() set sort(value: MaintenanceSortOption) {
    this.selectedSort.set(value ?? 'newest');
  }

  @Input() set page(value: number) {
    this.pageValue.set(value ?? 0);
  }

  @Input() set size(value: number) {
    this.sizeValue.set(value ?? 20);
  }

  @Input() set totalPages(value: number) {
    this.totalPagesValue.set(value ?? 0);
  }

  @Input() set totalElements(value: number) {
    this.totalElementsValue.set(value ?? 0);
  }

  @Output() recordSelected = new EventEmitter<T>();
  @Output() filterOpened = new EventEmitter<void>();
  @Output() addRequested = new EventEmitter<void>();
  @Output() queryChange = new EventEmitter<MaintenanceQueryChange>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() sizeChange = new EventEmitter<number>();

  protected readonly allCategoriesChecked = computed(() => {
    const categories = this.availableCategoriesValue();
    if (!categories.length) {
      return true;
    }

    const selected = new Set(this.selectedCategories());
    return categories.every((category) => selected.has(category));
  });

  protected readonly isEmpty = computed(() => this.totalElementsValue() === 0);
  protected readonly hasAnyRecordsAtAll = computed(() => this.totalRecordsValue() > 0);

  protected readonly sliderTrackStyle = computed(() => {
    const max = this.maxAvailablePriceValue();
    const range = max || 1;

    const startPercent = (this.minPriceLimit() / range) * 100;
    const endPercent = (this.maxPriceLimit() / range) * 100;

    return {
      '--track-start': `${Math.max(0, Math.min(100, startPercent))}%`,
      '--track-end': `${Math.max(0, Math.min(100, endPercent))}%`,
    };
  });

  constructor() {
    this.titleSearchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.emitQueryChange({ title: value }));

    this.priceRangeInput$
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emitQueryChange({}));
  }

  protected openRecordDetails(record: T) {
    this.closeFilterModal();
    this.recordSelected.emit(record);
  }

  protected openFilterModal() {
    this.isFilterModalOpen.set(true);
    this.filterOpened.emit();
  }

  protected closeFilterModal() {
    this.isFilterModalOpen.set(false);
  }

  protected toggleAllCategories(event: Event) {
    this.categoriesTouchedByUser = true;
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedCategories.set(checked ? [...this.availableCategoriesValue()] : []);
    this.emitQueryChange({});
  }

  protected isCategorySelected(category: string): boolean {
    return this.selectedCategories().includes(category);
  }

  protected toggleCategory(category: string, event: Event) {
    this.categoriesTouchedByUser = true;
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedCategories.set([...this.selectedCategories(), category]);
    } else {
      this.selectedCategories.set(
        this.selectedCategories().filter((selectedCategory) => selectedCategory !== category)
      );
    }

    this.emitQueryChange({});
  }

  protected onMinPriceLimitChange(event: Event) {
    const parsed = Number((event.target as HTMLInputElement).value);
    if (Number.isNaN(parsed)) {
      return;
    }

    this.priceRangeTouchedByUser = true;
    const bounded = Math.max(0, parsed);
    this.minPriceLimit.set(Math.min(bounded, this.maxPriceLimit()));
    this.priceRangeInput$.next();
  }

  protected onMaxPriceLimitChange(event: Event) {
    const parsed = Number((event.target as HTMLInputElement).value);
    if (Number.isNaN(parsed)) {
      return;
    }

    this.priceRangeTouchedByUser = true;
    const bounded = Math.min(this.maxAvailablePriceValue(), parsed);
    this.maxPriceLimit.set(Math.max(bounded, this.minPriceLimit()));
    this.priceRangeInput$.next();
  }

  protected onCurrencyFilterChange(event: Event) {
    const rawValue = (event.target as HTMLSelectElement).value;
    const selected =
      rawValue === this.allCurrenciesOption || this.availableCurrencies.includes(rawValue)
        ? rawValue
        : this.allCurrenciesOption;

    this.selectedCurrencyFilter.set(selected);
    this.emitQueryChange({});
  }

  protected resetFilters() {
    this.categoriesTouchedByUser = false;
    this.priceRangeTouchedByUser = false;
    this.selectedCategories.set([...this.availableCategoriesValue()]);
    this.selectedCurrencyFilter.set(this.allCurrenciesOption);
    this.minPriceLimit.set(0);
    this.maxPriceLimit.set(this.maxAvailablePriceValue());
    this.emitQueryChange({});
  }

  protected onSortChange(event: Event) {
    const rawValue = (event.target as HTMLSelectElement).value;
    if (
      rawValue !== 'newest' &&
      rawValue !== 'oldest' &&
      rawValue !== 'price-low-high' &&
      rawValue !== 'price-high-low'
    ) {
      return;
    }

    this.selectedSort.set(rawValue);
    this.emitQueryChange({ sort: rawValue });
  }

  protected onTitleSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value.trimStart();
    this.titleSearch.set(value);
    this.titleSearchInput$.next(value);
  }

  protected onPageChange(page: number) {
    this.pageChange.emit(page);
  }

  protected onSizeChange(size: number) {
    this.sizeChange.emit(size);
  }

  protected hasMileageWarning(record: T): boolean {
    return this.mileageWarningRecordIdsValue().has(record.id);
  }

  protected requestAdd() {
    this.addRequested.emit();
  }

  protected getTitleTranslationKey(translationKey: string): string {
    return `${this.titleKeyPrefixValue()}.${translationKey}`;
  }

  /**
   * Keeps the category selection in sync with the available categories until the user manually
   * toggles one: before that point every update (including the initial load) should select all
   * currently-known categories, since we can't tell "not loaded yet" apart from "loaded as
   * empty" by value alone.
   */
  private syncCategoryDefaults() {
    const availableCategories = this.availableCategoriesValue();

    if (!this.categoriesTouchedByUser) {
      this.selectedCategories.set([...availableCategories]);
      return;
    }

    const selected = this.selectedCategories().filter((category) =>
      availableCategories.includes(category)
    );
    if (selected.length !== this.selectedCategories().length) {
      this.selectedCategories.set(selected);
    }
  }

  /**
   * Keeps the price range in sync with the available max price until the user manually adjusts
   * it. Re-syncing on every update (rather than only once) avoids locking in a stale `0` if this
   * input's initial default value arrives before the real max price is loaded.
   */
  private syncPriceRangeDefaults() {
    const maxPrice = this.maxAvailablePriceValue();

    if (!this.priceRangeTouchedByUser) {
      this.minPriceLimit.set(0);
      this.maxPriceLimit.set(maxPrice);
      return;
    }

    if (this.maxPriceLimit() > maxPrice) {
      this.maxPriceLimit.set(maxPrice);
    }

    if (this.minPriceLimit() > this.maxPriceLimit()) {
      this.minPriceLimit.set(this.maxPriceLimit());
    }
  }

  private emitQueryChange(partial: Partial<MaintenanceQueryChange>) {
    const availableCategories = this.availableCategoriesValue();
    const selectedCategories = this.selectedCategories();
    // When the caller has no known category list (e.g. the public share view, which has no
    // access to the categories metadata endpoint), never filter by category: an empty array
    // would mean "match nothing" server-side, which is never the intent here.
    const categories =
      availableCategories.length === 0 || selectedCategories.length === availableCategories.length
        ? undefined
        : selectedCategories;

    const minCost = this.minPriceLimit() > 0 ? this.minPriceLimit() : null;
    const maxCost =
      this.maxPriceLimit() < this.maxAvailablePriceValue() ? this.maxPriceLimit() : null;

    this.queryChange.emit({
      title: this.titleSearch(),
      sort: this.selectedSort(),
      categories,
      currency: this.selectedCurrencyFilter(),
      minCost,
      maxCost,
      ...partial,
    });
  }
}
