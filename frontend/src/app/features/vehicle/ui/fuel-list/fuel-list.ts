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
import { DateFormatPipe, MoneyPipe } from '../../../../shared/pipes';
import { CurrencyService } from '../../../../shared/services/currency.service';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import { formatFuelAmount, getFuelPricePerUnit } from '../../../../shared/utils/fuel-record.utils';
import type { FuelListRecord, FuelSortOption } from '../../../../shared/utils/fuel-list.utils';

export interface FuelQueryChange {
  gasStation: string;
  sort: FuelSortOption;
}

/**
 * Controlled fuel-record timeline: the parent owns the query (search/sort), the page and the
 * mileage-warning set (all derived from server state), and this component only renders the
 * current page and reports user intent through `queryChange`/`pageChange`/`sizeChange`.
 */
@Component({
  selector: 'app-fuel-list',
  imports: [
    CommonModule,
    TranslateModule,
    LucideAngularModule,
    DateFormatPipe,
    MoneyPipe,
    Pagination,
  ],
  templateUrl: './fuel-list.html',
  styleUrl: './fuel-list.css',
})
export class FuelList<T extends FuelListRecord> {
  private readonly currencyService = inject(CurrencyService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchInput$ = new Subject<string>();

  protected readonly fuelRecords = signal<T[]>([]);
  protected readonly gasStationSearch = signal('');
  protected readonly selectedSort = signal<FuelSortOption>('newest');
  protected readonly titleKeyPrefixValue = signal('vehicle.fuelTab');
  protected readonly showAddButtonValue = signal(false);
  protected readonly totalRecordsValue = signal(0);
  protected readonly totalCostTextValue = signal('');
  protected readonly mileageWarningRecordIdsValue = signal<ReadonlySet<number>>(new Set());
  protected readonly pageValue = signal(0);
  protected readonly sizeValue = signal(20);
  protected readonly totalPagesValue = signal(0);
  protected readonly totalElementsValue = signal(0);

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

  @Input()
  set mileageWarningRecordIds(value: ReadonlySet<number>) {
    this.mileageWarningRecordIdsValue.set(value ?? new Set());
  }

  @Input()
  set search(value: string) {
    this.gasStationSearch.set(value ?? '');
  }

  @Input()
  set sort(value: FuelSortOption) {
    this.selectedSort.set(value ?? 'newest');
  }

  @Input()
  set page(value: number) {
    this.pageValue.set(value ?? 0);
  }

  @Input()
  set size(value: number) {
    this.sizeValue.set(value ?? 20);
  }

  @Input()
  set totalPages(value: number) {
    this.totalPagesValue.set(value ?? 0);
  }

  @Input()
  set totalElements(value: number) {
    this.totalElementsValue.set(value ?? 0);
  }

  @Output() recordSelected = new EventEmitter<T>();
  @Output() addRequested = new EventEmitter<void>();
  @Output() queryChange = new EventEmitter<FuelQueryChange>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() sizeChange = new EventEmitter<number>();

  protected readonly isEmpty = computed(() => this.totalElementsValue() === 0);
  protected readonly hasAnyRecordsAtAll = computed(() => this.totalRecordsValue() > 0);

  constructor() {
    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.emitQueryChange({ gasStation: value }));
  }

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
    return this.mileageWarningRecordIdsValue().has(record.id);
  }

  protected onGasStationSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value.trimStart();
    this.gasStationSearch.set(value);
    this.searchInput$.next(value);
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
    this.emitQueryChange({ sort: rawValue });
  }

  protected onPageChange(page: number) {
    this.pageChange.emit(page);
  }

  protected onSizeChange(size: number) {
    this.sizeChange.emit(size);
  }

  protected openRecordDetails(record: T) {
    this.recordSelected.emit(record);
  }

  protected requestAdd() {
    this.addRequested.emit();
  }

  private emitQueryChange(partial: Partial<FuelQueryChange>) {
    this.queryChange.emit({
      gasStation: this.gasStationSearch(),
      sort: this.selectedSort(),
      ...partial,
    });
  }
}
