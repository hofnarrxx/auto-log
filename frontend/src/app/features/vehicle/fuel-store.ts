import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject, catchError, finalize, of, switchMap, tap } from 'rxjs';
import type { FuelRecord, FuelRecordPayload } from './models';
import { FuelApi } from './services/fuel-api';

/**
 * Owns fuel-record server state for one vehicle. `load()` is fire-and-forget and safe to call
 * repeatedly as the active vehicle changes: it is fed through `switchMap`, so a stale in-flight
 * request for a previous vehicle is cancelled before it can overwrite newer results.
 */
@Injectable()
export class FuelStore {
  private readonly fuelApi = inject(FuelApi);
  private readonly load$ = new Subject<number>();

  private readonly _records = signal<FuelRecord[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _isSaving = signal(false);
  private readonly _isDeleting = signal(false);

  readonly records = this._records.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly isDeleting = this._isDeleting.asReadonly();

  constructor() {
    this.load$
      .pipe(
        tap(() => {
          this._isLoading.set(true);
          this._error.set(null);
        }),
        switchMap((vehicleId) =>
          this.fuelApi.getAll(vehicleId).pipe(
            catchError(() => {
              this._error.set('vehicle.fuelTab.errors.loadFailed');
              return of<FuelRecord[]>([]);
            }),
            finalize(() => this._isLoading.set(false))
          )
        )
      )
      .subscribe((records) => this._records.set(records));
  }

  load(vehicleId: number): void {
    this.load$.next(vehicleId);
  }

  clear(): void {
    this._records.set([]);
    this._error.set(null);
  }

  save(vehicleId: number, payload: FuelRecordPayload, recordId?: number): Observable<FuelRecord> {
    this._isSaving.set(true);

    const request$ = recordId
      ? this.fuelApi.update(vehicleId, recordId, payload)
      : this.fuelApi.create(vehicleId, payload);

    return request$.pipe(
      tap(() => this.load(vehicleId)),
      finalize(() => this._isSaving.set(false))
    );
  }

  delete(vehicleId: number, recordId: number): Observable<void> {
    this._isDeleting.set(true);

    return this.fuelApi.remove(vehicleId, recordId).pipe(
      tap(() => this.load(vehicleId)),
      finalize(() => this._isDeleting.set(false))
    );
  }
}
