import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject, catchError, finalize, of, switchMap, tap } from 'rxjs';
import type { Page } from '../../shared/models';
import { emptyPage } from '../../shared/models';
import type { FuelQuery, FuelRecord, FuelRecordPayload, FuelSummary } from './models';
import { DEFAULT_FUEL_QUERY } from './models';
import { FuelApi } from './services/fuel-api';

/**
 * Owns fuel-record server state for one vehicle: the current page of records plus the query
 * (sort/filter/page/size) that produced it, and the summary aggregates computed over the whole
 * dataset. `load()` (and every query/page/size change) is fire-and-forget and safe to call
 * repeatedly: it is fed through `switchMap`, so a stale in-flight request is cancelled before it
 * can overwrite newer results.
 */
@Injectable()
export class FuelStore {
  private readonly fuelApi = inject(FuelApi);
  private readonly load$ = new Subject<{ vehicleId: number; query: FuelQuery }>();
  private currentVehicleId: number | null = null;

  private readonly _query = signal<FuelQuery>(DEFAULT_FUEL_QUERY);
  private readonly _records = signal<FuelRecord[]>([]);
  private readonly _page = signal(0);
  private readonly _size = signal(DEFAULT_FUEL_QUERY.size);
  private readonly _totalElements = signal(0);
  private readonly _totalPages = signal(0);
  private readonly _isLoading = signal(false);
  // Distinguishes the very first load (which the tab shows a full-page loading state for) from
  // subsequent sort/filter/page refetches, which should keep the list mounted so components like
  // `FuelList` don't lose their own local UI state on every query change.
  private readonly _hasLoadedOnce = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _isSaving = signal(false);
  private readonly _isDeleting = signal(false);
  private readonly _summary = signal<FuelSummary | null>(null);
  private readonly _isSummaryLoading = signal(false);

  readonly query = this._query.asReadonly();
  readonly records = this._records.asReadonly();
  readonly page = this._page.asReadonly();
  readonly size = this._size.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly hasLoadedOnce = this._hasLoadedOnce.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly isDeleting = this._isDeleting.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly isSummaryLoading = this._isSummaryLoading.asReadonly();

  constructor() {
    this.load$
      .pipe(
        tap(() => {
          this._isLoading.set(true);
          this._error.set(null);
        }),
        switchMap(({ vehicleId, query }) =>
          this.fuelApi.getPage(vehicleId, query).pipe(
            catchError(() => {
              this._error.set('vehicle.fuelTab.errors.loadFailed');
              return of<Page<FuelRecord>>(emptyPage(query.page, query.size));
            }),
            finalize(() => this._isLoading.set(false))
          )
        )
      )
      .subscribe((page) => this.applyPage(page));
  }

  /** (Re)loads the first page for a vehicle with the default query, e.g. on tab activation. */
  load(vehicleId: number): void {
    this.currentVehicleId = vehicleId;
    this._query.set(DEFAULT_FUEL_QUERY);
    this._hasLoadedOnce.set(false);
    this.fetch();
  }

  /** Loads the summary aggregates (totals, warnings, average consumption) for a vehicle. */
  loadSummary(vehicleId: number): void {
    this._isSummaryLoading.set(true);

    this.fuelApi
      .getSummary(vehicleId)
      .pipe(
        catchError(() => of(null)),
        finalize(() => this._isSummaryLoading.set(false))
      )
      .subscribe((summary) => this._summary.set(summary));
  }

  /** Merges a sort/filter change into the query and resets to the first page. */
  setQuery(partial: Partial<Omit<FuelQuery, 'page' | 'size'>>): void {
    this._query.update((current) => ({ ...current, ...partial, page: 0 }));
    this.fetch();
  }

  /** Jumps to a specific (0-based) page without touching sort/filter state. */
  setPage(page: number): void {
    this._query.update((current) => ({ ...current, page }));
    this.fetch();
  }

  /** Changes the page size and resets to the first page. */
  setSize(size: number): void {
    this._query.update((current) => ({ ...current, size, page: 0 }));
    this.fetch();
  }

  clear(): void {
    this.currentVehicleId = null;
    this._records.set([]);
    this._error.set(null);
    this._query.set(DEFAULT_FUEL_QUERY);
    this._page.set(0);
    this._totalElements.set(0);
    this._totalPages.set(0);
    this._summary.set(null);
    this._hasLoadedOnce.set(false);
  }

  save(vehicleId: number, payload: FuelRecordPayload, recordId?: number): Observable<FuelRecord> {
    this._isSaving.set(true);
    this.currentVehicleId = vehicleId;

    const request$ = recordId
      ? this.fuelApi.update(vehicleId, recordId, payload)
      : this.fuelApi.create(vehicleId, payload);

    return request$.pipe(
      tap(() => {
        this.fetch();
        this.loadSummary(vehicleId);
      }),
      finalize(() => this._isSaving.set(false))
    );
  }

  delete(vehicleId: number, recordId: number): Observable<void> {
    this._isDeleting.set(true);
    this.currentVehicleId = vehicleId;

    return this.fuelApi.remove(vehicleId, recordId).pipe(
      tap(() => {
        this.reloadAfterDelete();
        this.loadSummary(vehicleId);
      }),
      finalize(() => this._isDeleting.set(false))
    );
  }

  private reloadAfterDelete(): void {
    const isLastPage = this._page() >= this._totalPages() - 1;
    const wouldBeEmpty = this._records().length <= 1;

    if (isLastPage && wouldBeEmpty && this._page() > 0) {
      this.setPage(this._page() - 1);
      return;
    }

    this.fetch();
  }

  private fetch(): void {
    if (this.currentVehicleId === null) {
      return;
    }

    this.load$.next({ vehicleId: this.currentVehicleId, query: this._query() });
  }

  private applyPage(page: Page<FuelRecord>): void {
    this._records.set(page.items);
    this._page.set(page.page);
    this._size.set(page.size);
    this._totalElements.set(page.totalElements);
    this._totalPages.set(page.totalPages);
    this._hasLoadedOnce.set(true);
  }
}
