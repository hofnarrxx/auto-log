import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedVehicleMaintenanceTab } from './shared-vehicle-maintenance-tab';
import { SharedVehicleFuelTab } from './shared-vehicle-fuel-tab';
import type { SharedFuelEntry, SharedMaintenanceEntry, SharedVehicleResponse } from './shared-vehicle-model';

type SharedTab = 'details' | 'maintenance' | 'fuel';

@Component({
  selector: 'app-shared-vehicle',
  standalone: true,
  imports: [CommonModule, SharedVehicleMaintenanceTab, SharedVehicleFuelTab, TranslateModule],
  templateUrl: './shared-vehicle.html',
  styleUrl: './shared-vehicle.css',
})
export class SharedVehicle {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly translate = inject(TranslateService);

  private readonly tokenParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly token = computed(() => this.tokenParamMap().get('token') ?? '');
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<SharedVehicleResponse | null>(null);
  readonly activeTab = signal<SharedTab>('details');

  fuelTypeLabel(fuelType: string | null | undefined): string {
    const value = (fuelType ?? '').trim().toLowerCase();

    switch (value) {
      case 'petrol':
        return this.translate.instant('vehicle.form.fuelTypes.petrol');
      case 'diesel':
        return this.translate.instant('vehicle.form.fuelTypes.diesel');
      case 'hybrid':
        return this.translate.instant('vehicle.form.fuelTypes.hybrid');
      case 'electric':
        return this.translate.instant('vehicle.form.fuelTypes.electric');
      case 'lpg':
        return this.translate.instant('vehicle.form.fuelTypes.lpg');
      case 'cng':
        return this.translate.instant('vehicle.form.fuelTypes.cng');
      default:
        return fuelType || '-';
    }
  }

  ngOnInit() {
    this.load();
  }

  load() {
    const token = this.token();
    if (!token) {
      this.error.set('sharedVehicle.errors.invalidLink');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<SharedVehicleResponse>(`http://localhost:8080/share/${token}`).subscribe({
      next: response => {
        this.data.set(response);
        this.activeTab.set('details');
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('sharedVehicle.errors.expiredOrInvalid');
        this.isLoading.set(false);
      }
    });
  }

  formatDate(date: string | null | undefined): string {
    if (!date) {
      return '-';
    }

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }

    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  lastOdometerReading(): string {
    const mileage = this.getLatestOdometerMileage();

    if (mileage === null) {
      return '-';
    }

    return `${mileage.toLocaleString()} km`;
  }

  lastOdometerDate(): string {
    const latest = this.getLatestOdometerRecord();

    if (!latest) {
      return '-';
    }

    const date = (latest as SharedFuelEntry).date ?? (latest as SharedMaintenanceEntry).serviceDate;
    return this.formatDate(date);
  }

  setTab(tab: SharedTab) {
    this.activeTab.set(tab);
  }

  private getLatestOdometerRecord(): SharedFuelEntry | SharedMaintenanceEntry | null {
    const response = this.data();
    if (!response) {
      return null;
    }

    const fuelRecords = (response.fuelEntries ?? []).filter(record => record.mileage !== null);
    const maintenanceRecords = (response.maintenanceEntries ?? []).filter(record => record.mileage !== null);
    const allRecords = [...fuelRecords, ...maintenanceRecords] as (SharedFuelEntry | SharedMaintenanceEntry)[];

    if (!allRecords.length) {
      return null;
    }

    return [...allRecords].sort((left, right) => {
      const leftDate = (left as SharedFuelEntry).date ?? (left as SharedMaintenanceEntry).serviceDate;
      const rightDate = (right as SharedFuelEntry).date ?? (right as SharedMaintenanceEntry).serviceDate;
      return this.toTimestamp(rightDate) - this.toTimestamp(leftDate);
    })[0];
  }

  private getLatestOdometerMileage(): number | null {
    const latest = this.getLatestOdometerRecord();

    if (latest && latest.mileage !== null && latest.mileage !== undefined) {
      return latest.mileage;
    }

    const fallbackMileage = this.data()?.mileage;
    return fallbackMileage === null || fallbackMileage === undefined ? null : Math.trunc(fallbackMileage);
  }

  private toTimestamp(date: string): number {
    const timestamp = new Date(`${date}T00:00:00`).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }
}