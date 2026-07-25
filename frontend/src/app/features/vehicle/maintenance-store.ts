import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import type {
  MaintenanceAttachmentDownloadUrlResponse,
  MaintenanceRecord,
  MaintenanceRecordPayload,
} from './models';
import { MaintenanceApiService } from './services/maintenance-api.service';

const FALLBACK_CATEGORIES = [
  'Inspection',
  'Oil change',
  'Repair',
  'Part Replacement',
  'Fluid refill',
  'Tires & Wheels',
  'Cosmetic',
];

@Injectable({
  providedIn: 'root',
})
export class MaintenanceStore {
  private readonly maintenanceApi = inject(MaintenanceApiService);

  readonly records = signal<MaintenanceRecord[]>([]);
  readonly categories = signal<string[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly error = signal<string | null>(null);

  load(vehicleId: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.maintenanceApi
      .getMaintenance(vehicleId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: data => {
          this.records.set(data);
        },
        error: () => {
          this.records.set([]);
          this.error.set('vehicle.maintenanceTab.errors.loadFailed');
        },
      });
  }

  clear(): void {
    this.records.set([]);
    this.error.set(null);
  }

  loadCategories(): void {
    this.maintenanceApi.getCategories().subscribe({
      next: categories => {
        this.categories.set(categories);
      },
      error: () => {
        this.categories.set(FALLBACK_CATEGORIES);
      },
    });
  }

  save(
    vehicleId: number,
    payload: MaintenanceRecordPayload,
    recordId?: number
  ): Observable<MaintenanceRecord> {
    this.isSaving.set(true);

    const request$ = recordId
      ? this.maintenanceApi.updateMaintenance(vehicleId, recordId, payload)
      : this.maintenanceApi.createMaintenance(vehicleId, payload);

    return request$.pipe(finalize(() => this.isSaving.set(false)));
  }

  delete(vehicleId: number, recordId: number): Observable<void> {
    this.isDeleting.set(true);

    return this.maintenanceApi.deleteMaintenance(vehicleId, recordId).pipe(
      tap(() => {
        this.records.update(records => records.filter(record => record.id !== recordId));
      }),
      finalize(() => this.isDeleting.set(false))
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
