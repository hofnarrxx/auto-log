import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { formatAppDate } from '../../../../shared/utils/date-format.utils';
import { getFuelTypeLabelKey } from '../../../../shared/utils/fuel-type.utils';
import {
  getLatestOdometerMileage,
  getLatestOdometerRecord,
  getOdometerRecordDate,
} from '../../../../shared/utils/odometer.utils';
import type { FuelRecord, MaintenanceRecord, Vehicle } from '../../models';
import { getAverageFuelConsumptionPer100Km } from '../../utils/vehicle-statistics';
import { FuelStore } from '../../fuel-store';
import { MaintenanceStore } from '../../maintenance-store';

@Component({
  selector: 'app-vehicle-details-tab',
  imports: [TranslateModule],
  templateUrl: './vehicle-details-tab.html',
  styleUrl: './vehicle-details-tab.css',
})
export class VehicleDetailsTab {
  private translate = inject(TranslateService);
  private fuelStore = inject(FuelStore);
  private maintenanceStore = inject(MaintenanceStore);

  @Input({ required: true }) vehicle!: Vehicle;
  @Output() editRequested = new EventEmitter<void>();
  @Output() deleteRequested = new EventEmitter<void>();
  @Output() shareRequested = new EventEmitter<void>();

  protected readonly fuelRecords: () => FuelRecord[] = this.fuelStore.records;
  protected readonly maintenanceRecords: () => MaintenanceRecord[] = this.maintenanceStore.records;

  protected readonly avgFuelEfficiency = computed(() => {
    const litresPer100Km = getAverageFuelConsumptionPer100Km(this.fuelRecords());
    return litresPer100Km === null ? '-' : `${litresPer100Km.toFixed(2)} L/100km`;
  });

  ngOnInit() {
    if (this.vehicle?.id) {
      this.fuelStore.load(this.vehicle.id);
      this.maintenanceStore.load(this.vehicle.id);
    }
  }

  protected lastOdometerReading(): string {
    const mileage = getLatestOdometerMileage(this.odometerRecords(), this.vehicle.mileage);

    if (mileage === null) {
      return '-';
    }

    return `${mileage.toLocaleString()} km`;
  }

  protected lastOdometerDate(): string {
    const latest = getLatestOdometerRecord(this.odometerRecords());

    if (!latest) {
      return '-';
    }

    return formatAppDate(getOdometerRecordDate(latest));
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
    const labelKey = getFuelTypeLabelKey(this.vehicle.fuelType);
    return labelKey === null ? (this.vehicle.fuelType ?? '-') : this.translate.instant(labelKey);
  }

  protected vehicleThumbnailAlt(): string {
    return this.translate.instant('vehicle.details.thumbnailAlt');
  }

  private odometerRecords(): (FuelRecord | MaintenanceRecord)[] {
    return [...this.fuelRecords(), ...this.maintenanceRecords()];
  }
}
