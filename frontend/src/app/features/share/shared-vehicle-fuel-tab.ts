import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, catchError, finalize, of, switchMap, tap } from 'rxjs';
import type { Page } from '../../shared/models';
import { emptyPage } from '../../shared/models';
import { CurrencyService } from '../../shared/services/currency.service';
import { Modal } from '../../shared/ui/modal/modal';
import { formatCurrencyTotals } from '../../shared/utils/currency-totals.utils';
import { FuelList, type FuelQueryChange } from '../vehicle/ui/fuel-list/fuel-list';
import { FuelRecordDetails } from '../vehicle/ui/fuel-record-details/fuel-record-details';
import type { FuelQuery, FuelRecord, FuelSummary } from '../vehicle/models';
import { DEFAULT_FUEL_QUERY } from '../vehicle/models';
import { PublicShareApi } from './public-share-api';

/**
 * Read-only counterpart of `VehicleFuelTab` for the public share page: it owns the same
 * query/page state, but loads pages through `PublicShareApi` (by token) instead of a vehicle
 * store, and never mutates records.
 */
@Component({
  selector: 'app-shared-vehicle-fuel-tab',
  imports: [CommonModule, TranslateModule, Modal, FuelList, FuelRecordDetails],
  templateUrl: './shared-vehicle-fuel-tab.html',
  styleUrl: './shared-vehicle-fuel-tab.css',
})
export class SharedVehicleFuelTab {
  private readonly publicShareApi = inject(PublicShareApi);
  private readonly currencyService = inject(CurrencyService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly load$ = new Subject<{ token: string; query: FuelQuery }>();

  private currentToken = '';

  @Input({ required: true })
  set token(value: string) {
    this.currentToken = value ?? '';
    this.query.set(DEFAULT_FUEL_QUERY);
    this.fetch();
  }

  @Input({ required: true })
  set summary(value: FuelSummary | null) {
    this.summaryValue.set(value ?? null);
  }

  protected readonly summaryValue = signal<FuelSummary | null>(null);
  protected readonly query = signal<FuelQuery>(DEFAULT_FUEL_QUERY);
  protected readonly fuelRecords = signal<FuelRecord[]>([]);
  protected readonly page = signal(0);
  protected readonly size = signal(DEFAULT_FUEL_QUERY.size);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly isModalOpen = signal(false);
  protected readonly selectedRecord = signal<FuelRecord | null>(null);

  protected readonly totalFuelCostByCurrency = computed(() =>
    formatCurrencyTotals(this.summaryValue()?.totalCostByCurrency, (value, currency) =>
      this.currencyService.formatCurrency(value, currency)
    )
  );
  protected readonly mileageWarningRecordIds = computed(
    () => new Set(this.summaryValue()?.mileageWarningRecordIds ?? [])
  );

  constructor() {
    this.load$
      .pipe(
        tap(() => {
          this.isLoading.set(true);
          this.error.set(null);
        }),
        switchMap(({ token, query }) =>
          this.publicShareApi.getFuelPage(token, query).pipe(
            catchError(() => {
              this.error.set('sharedVehicle.fuelTab.errors.loadFailed');
              return of<Page<FuelRecord>>(emptyPage(query.page, query.size));
            }),
            finalize(() => this.isLoading.set(false))
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((page) => this.applyPage(page));
  }

  protected hasMileageWarning(record: FuelRecord): boolean {
    return this.mileageWarningRecordIds().has(record.id);
  }

  protected onQueryChange(change: FuelQueryChange) {
    this.query.update((current) => ({ ...current, ...change, page: 0 }));
    this.fetch();
  }

  protected onPageChange(page: number) {
    this.query.update((current) => ({ ...current, page }));
    this.fetch();
  }

  protected onSizeChange(size: number) {
    this.query.update((current) => ({ ...current, size, page: 0 }));
    this.fetch();
  }

  protected openRecordDetails(record: FuelRecord) {
    this.selectedRecord.set(record);
    this.isModalOpen.set(true);
  }

  protected closeModal() {
    this.isModalOpen.set(false);
    this.selectedRecord.set(null);
  }

  private fetch(): void {
    if (!this.currentToken) {
      return;
    }

    this.load$.next({ token: this.currentToken, query: this.query() });
  }

  private applyPage(page: Page<FuelRecord>): void {
    this.fuelRecords.set(page.items);
    this.page.set(page.page);
    this.size.set(page.size);
    this.totalElements.set(page.totalElements);
    this.totalPages.set(page.totalPages);
  }
}
