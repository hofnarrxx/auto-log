import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { formatAppDate } from '../../shared/utils/date-format.utils';
import { getFuelTypeLabelKey } from '../../shared/utils/fuel-type.utils';
import { pickLatestOdometer } from '../../shared/utils/odometer.utils';
import { SharedVehicleMaintenanceTab } from './shared-vehicle-maintenance-tab';
import { SharedVehicleFuelTab } from './shared-vehicle-fuel-tab';
import type { SharedVehicleResponse } from './shared-vehicle-model';
import { PublicShareApi } from './public-share-api';

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
  private readonly publicShareApi = inject(PublicShareApi);
  private readonly translate = inject(TranslateService);

  private readonly tokenParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly token = computed(() => this.tokenParamMap().get('token') ?? '');
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<SharedVehicleResponse | null>(null);
  readonly activeTab = signal<SharedTab>('details');

  readonly latestOdometer = computed(() =>
    pickLatestOdometer(
      this.data()?.fuelSummary.latestOdometerRecord ?? null,
      this.data()?.maintenanceSummary.latestOdometer ?? null
    )
  );

  fuelTypeLabel(fuelType: string | null | undefined): string {
    const labelKey = getFuelTypeLabelKey(fuelType);
    return labelKey === null ? fuelType || '-' : this.translate.instant(labelKey);
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

    this.publicShareApi.getSharedVehicle(token).subscribe({
      next: (response) => {
        this.data.set(response);
        this.activeTab.set('details');
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('sharedVehicle.errors.expiredOrInvalid');
        this.isLoading.set(false);
      },
    });
  }

  lastOdometerReading(): string {
    const mileage = this.latestOdometer()?.mileage ?? this.data()?.mileage;

    if (mileage === null || mileage === undefined) {
      return '-';
    }

    return `${Math.trunc(mileage).toLocaleString()} km`;
  }

  lastOdometerDate(): string {
    const latest = this.latestOdometer();

    if (!latest) {
      return '-';
    }

    return formatAppDate(latest.date);
  }

  setTab(tab: SharedTab) {
    this.activeTab.set(tab);
  }
}
