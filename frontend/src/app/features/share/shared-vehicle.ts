import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedVehicleMaintenanceTab } from './shared-vehicle-maintenance-tab';
import { SharedVehicleFuelTab } from './shared-vehicle-fuel-tab';
import type { SharedVehicleResponse } from './shared-vehicle-model';

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

  setTab(tab: SharedTab) {
    this.activeTab.set(tab);
  }
}