import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { formatAppDate } from '../../../../shared/utils/date-format.utils';
import type { FuelRecord, MaintenanceRecord, Vehicle } from '../../models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-vehicle-details-tab',
  imports: [TranslateModule],
  templateUrl: './vehicle-details-tab.html',
  styleUrl: './vehicle-details-tab.css',
})
export class VehicleDetailsTab {
  private translate = inject(TranslateService);
  private http = inject(HttpClient);
  private vehicleApi = `${environment.apiBaseUrl}/vehicles`;

  @Input({ required: true }) vehicle!: Vehicle;
  @Output() editRequested = new EventEmitter<void>();
  @Output() deleteRequested = new EventEmitter<void>();
  @Output() shareRequested = new EventEmitter<void>();

  protected readonly isLoadingStats = signal(false);
  protected readonly fuelRecords = signal<FuelRecord[]>([]);
  protected readonly maintenanceRecords = signal<MaintenanceRecord[]>([]);

  protected readonly avgFuelEfficiency = computed(() => {
    const records = [...this.fuelRecords()]
      .filter((record) => record.mileage !== null && record.amount !== null && record.amount > 0)
      .sort((left, right) => this.toTimestamp(left.date) - this.toTimestamp(right.date));

    if (records.length < 2) {
      return '-';
    }

    let totalKm = 0;
    let totalLiters = 0;

    for (let index = 1; index < records.length; index++) {
      const previous = records[index - 1];
      const current = records[index];

      if (previous.mileage === null || current.mileage === null) {
        continue;
      }

      if (current.mileage < previous.mileage) {
        continue;
      }

      const distance = current.mileage - previous.mileage;
      if (distance <= 0 || current.amount === null) {
        continue;
      }

      totalKm += distance;
      totalLiters += current.amount;
    }

    if (totalKm <= 0 || totalLiters <= 0) {
      return '-';
    }

    return `${((totalLiters / totalKm) * 100).toFixed(2)} L/100km`;
  });

  ngOnInit() {
    if (this.vehicle?.id) {
      this.loadFuelRecords();
      this.loadMaintenanceRecords();
    }
  }

  protected lastOdometerReading(): string {
    const mileage = this.getLatestOdometerMileage();

    if (mileage === null) {
      return '-';
    }

    return `${mileage.toLocaleString()} km`;
  }

  protected lastOdometerDate(): string {
    const latest = this.getLatestOdometerRecord();

    if (!latest) {
      return '-';
    }

    const date = (latest as FuelRecord).date ?? (latest as MaintenanceRecord).serviceDate;
    return formatAppDate(date);
  }

  protected vehicleInfoTitle(): string {
    return this.translate.instant('vehicle.details.title');
  }

  protected shareVehicleLabel(): string {
    return this.translate.instant('vehicle.details.shareVehicle');
  }

  protected editVehicleLabel(): string {
    return this.translate.instant('vehicle.details.editVehicle');
  }

  protected deleteVehicleLabel(): string {
    return this.translate.instant('vehicle.details.deleteVehicle');
  }

  protected brandLabel(): string {
    return this.translate.instant('common.brand');
  }

  protected modelLabel(): string {
    return this.translate.instant('common.model');
  }

  protected yearLabel(): string {
    return this.translate.instant('common.year');
  }

  protected mileageLabel(): string {
    return this.translate.instant('common.mileage');
  }

  protected fuelTypeLabel(): string {
    const value = this.vehicle.fuelType?.trim().toLowerCase();
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
        return this.vehicle.fuelType ?? '-';
    }
  }

  protected vehicleThumbnailAlt(): string {
    return this.translate.instant('vehicle.details.thumbnailAlt');
  }

  private loadFuelRecords() {
    if (!this.vehicle?.id) {
      return;
    }

    this.isLoadingStats.set(true);

    this.http
      .get<FuelRecord[]>(`${this.vehicleApi}/${this.vehicle.id}/fuel`)
      .pipe(finalize(() => this.isLoadingStats.set(false)))
      .subscribe({
        next: (records) => this.fuelRecords.set(records ?? []),
        error: () => this.fuelRecords.set([]),
      });
  }

  private loadMaintenanceRecords() {
    if (!this.vehicle?.id) {
      return;
    }

    this.http
      .get<MaintenanceRecord[]>(`${this.vehicleApi}/${this.vehicle.id}/maintenance`)
      .subscribe({
        next: (records) => this.maintenanceRecords.set(records ?? []),
        error: () => this.maintenanceRecords.set([]),
      });
  }

  private getLatestFuelRecord(): FuelRecord | null {
    const records = this.fuelRecords().filter((record) => record.mileage !== null);

    if (!records.length) {
      return null;
    }

    return [...records].sort(
      (left, right) => this.toTimestamp(right.date) - this.toTimestamp(left.date)
    )[0];
  }

  private getLatestOdometerRecord(): FuelRecord | MaintenanceRecord | null {
    const fuelRecords = this.fuelRecords().filter((record) => record.mileage !== null);
    const maintenanceRecords = this.maintenanceRecords().filter(
      (record) => record.mileage !== null
    );
    const allRecords = [...fuelRecords, ...maintenanceRecords] as (
      FuelRecord | MaintenanceRecord
    )[];

    if (!allRecords.length) {
      return null;
    }

    return [...allRecords].sort((left, right) => {
      const leftDate = (left as FuelRecord).date ?? (left as MaintenanceRecord).serviceDate;
      const rightDate = (right as FuelRecord).date ?? (right as MaintenanceRecord).serviceDate;
      return this.toTimestamp(rightDate) - this.toTimestamp(leftDate);
    })[0];
  }

  private getLatestOdometerMileage(): number | null {
    const latest = this.getLatestOdometerRecord();

    if (latest && latest.mileage !== null && latest.mileage !== undefined) {
      return latest.mileage;
    }

    return this.vehicle.mileage === null || this.vehicle.mileage === undefined
      ? null
      : Math.trunc(this.vehicle.mileage);
  }

  private toTimestamp(date: string): number {
    const timestamp = new Date(`${date}T00:00:00`).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }
}
