import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject, catchError, finalize, of, switchMap, tap } from 'rxjs';
import type {
  MaintenanceAttachmentDownloadUrlResponse,
  MaintenanceRecord,
  MaintenanceRecordPayload,
} from './models';
import { MaintenanceApi } from './services/maintenance-api';

const FALLBACK_CATEGORIES = [
  'Inspection',
  'Oil change',
  'Repair',
  'Part Replacement',
  'Fluid refill',
  'Tires & Wheels',
  'Cosmetic',
];

/**
 * Owns maintenance-record server state for one vehicle. `load()` is fire-and-forget and safe to
 * call repeatedly as the active vehicle changes: it is fed through `switchMap`, so a stale
 * in-flight request for a previous vehicle is cancelled before it can overwrite newer results.
 */
@Injectable()
export class MaintenanceStore {
  private readonly maintenanceApi = inject(MaintenanceApi);
  private readonly load$ = new Subject<number>();

  private readonly _records = signal<MaintenanceRecord[]>([]);
  private readonly _categories = signal<string[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _isSaving = signal(false);
  private readonly _isDeleting = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly records = this._records.asReadonly();
  readonly categories = this._categories.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly isDeleting = this._isDeleting.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    this.load$
      .pipe(
        tap(() => {
          this._isLoading.set(true);
          this._error.set(null);
        }),
        switchMap((vehicleId) =>
          this.maintenanceApi.getMaintenance(vehicleId).pipe(
            catchError(() => {
              this._error.set('vehicle.maintenanceTab.errors.loadFailed');
              return of<MaintenanceRecord[]>([]);
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

  loadCategories(): void {
    this.maintenanceApi.getCategories().subscribe({
      next: (categories) => {
        this._categories.set(categories);
      },
      error: () => {
        this._categories.set(FALLBACK_CATEGORIES);
      },
    });
  }

  save(
    vehicleId: number,
    payload: MaintenanceRecordPayload,
    recordId?: number
  ): Observable<MaintenanceRecord> {
    this._isSaving.set(true);

    const request$ = recordId
      ? this.maintenanceApi.updateMaintenance(vehicleId, recordId, payload)
      : this.maintenanceApi.createMaintenance(vehicleId, payload);

    return request$.pipe(finalize(() => this._isSaving.set(false)));
  }

  delete(vehicleId: number, recordId: number): Observable<void> {
    this._isDeleting.set(true);

    return this.maintenanceApi.deleteMaintenance(vehicleId, recordId).pipe(
      tap(() => {
        this._records.update((records) => records.filter((record) => record.id !== recordId));
      }),
      finalize(() => this._isDeleting.set(false))
    );
  }

  getAttachmentDownloadUrl(
    vehicleId: number,
    maintenanceId: number,
    attachmentId: number
  ): Observable<MaintenanceAttachmentDownloadUrlResponse> {
    return this.maintenanceApi.getAttachmentDownloadUrl(vehicleId, maintenanceId, attachmentId);
  }
}
