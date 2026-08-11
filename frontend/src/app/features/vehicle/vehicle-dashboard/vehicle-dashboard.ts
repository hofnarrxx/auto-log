import { Component, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { VehicleStore } from '../vehicle-store';
import { FuelStore } from '../fuel-store';
import { MaintenanceStore } from '../maintenance-store';
import { VehicleForm } from '../vehicle-form/vehicle-form';
import { Modal } from '@shared/ui/modal/modal';
import { parseVehicleTab } from '../utils/vehicle-tab.utils';
import { VehicleDetailsTab } from './details-tab/vehicle-details-tab';
import { VehicleMaintenanceTab } from './maintenance-tab/vehicle-maintenance-tab';
import { VehicleFuelTab } from './fuel-tab/vehicle-fuel-tab';
import { ShareLinkModal } from './share-link-modal/share-link-modal';

@Component({
  selector: 'app-vehicle-dashboard',
  imports: [
    VehicleForm,
    Modal,
    VehicleDetailsTab,
    VehicleMaintenanceTab,
    VehicleFuelTab,
    ShareLinkModal,
    TranslateModule,
  ],
  providers: [FuelStore, MaintenanceStore],
  templateUrl: './vehicle-dashboard.html',
  styleUrl: './vehicle-dashboard.css',
})
export class VehicleDashboard {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vehicleStore = inject(VehicleStore);
  showEditModal = signal(false);
  showShareModal = signal(false);
  private queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private paramMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  activeTab = computed(() => parseVehicleTab(this.queryParamMap().get('tab')));

  ngOnInit() {
    this.vehicleStore.load();
  }

  vehicle = computed(() => {
    const id = Number(this.paramMap().get('id'));
    return this.vehicleStore.vehicles().find((v) => v.id === id);
  });

  openEdit() {
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
  }

  openShareModal() {
    this.showShareModal.set(true);
  }

  closeShareModal() {
    this.showShareModal.set(false);
  }

  deleteVehicle() {
    const vehicle = this.vehicle();
    if (!vehicle) return;

    this.vehicleStore.remove(vehicle.id).subscribe({
      next: () => this.router.navigate(['/dashboard'], { replaceUrl: true }),
    });
  }
}
