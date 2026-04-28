import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Vehicle } from '../../vehicle-model';

@Component({
  selector: 'app-vehicle-details-tab',
  imports: [TranslateModule],
  templateUrl: './vehicle-details-tab.html',
  styleUrl: './vehicle-details-tab.css',
})
export class VehicleDetailsTab {
  private translate = inject(TranslateService);

  @Input({ required: true }) vehicle!: Vehicle;
  @Output() editRequested = new EventEmitter<void>();
  @Output() deleteRequested = new EventEmitter<void>();
  @Output() shareRequested = new EventEmitter<void>();

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
}
