import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { formatAppDate } from '../../../../shared/utils/date-format.utils';
import { getFuelTypeLabelKey } from '../../../../shared/utils/fuel-type.utils';
import { pickLatestOdometer } from '../../../../shared/utils/odometer.utils';
import type { Vehicle } from '../../models';
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

  private readonly fuelSummary = this.fuelStore.summary;
  private readonly maintenanceSummary = this.maintenanceStore.summary;

  protected readonly latestOdometer = computed(() =>
    pickLatestOdometer(
      this.fuelSummary()?.latestOdometerRecord ?? null,
      this.maintenanceSummary()?.latestOdometer ?? null
    )
  );

  protected readonly avgFuelEfficiency = computed(() => {
    const litresPer100Km = this.fuelSummary()?.averageConsumptionPer100km ?? null;
    return litresPer100Km === null ? '-' : `${litresPer100Km.toFixed(2)} L/100km`;
  });

  ngOnInit() {
    if (this.vehicle?.id) {
      this.fuelStore.loadSummary(this.vehicle.id);
      this.maintenanceStore.loadSummary(this.vehicle.id);
    }
  }

  protected lastOdometerReading(): string {
    const mileage = this.latestOdometer()?.mileage ?? this.vehicle.mileage;

    if (mileage === null || mileage === undefined) {
      return '-';
    }

    return `${Math.trunc(mileage).toLocaleString()} km`;
  }

  protected lastOdometerDate(): string {
    const latest = this.latestOdometer();

    if (!latest) {
      return '-';
    }

    return formatAppDate(latest.date);
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
}
