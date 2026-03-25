import { Component, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { VehicleStore } from '../vehicle-store';
import { VehicleForm } from '../vehicle-form/vehicle-form';
import { Modal } from '../../../shared/ui/modal/modal';
import { VehicleDetailsTab } from './details-tab/vehicle-details-tab';
import { VehicleMaintenanceTab } from './maintenance-tab/vehicle-maintenance-tab';

@Component({
  selector: 'app-vehicle-dashboard',
  imports: [VehicleForm, Modal, VehicleDetailsTab, VehicleMaintenanceTab],
  templateUrl: './vehicle-dashboard.html',
  styleUrl: './vehicle-dashboard.css',
})
export class VehicleDashboard {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vehicleStore = inject(VehicleStore);
  showModal = signal(false);
  private queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  activeTab = computed<'details' | 'maintenance'>(() => {
    const tab = this.queryParamMap().get('tab');
    return tab === 'maintenance' ? 'maintenance' : 'details';
  });

  ngOnInit() {
    this.vehicleStore.load();
  }

  vehicle = computed(() => {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    return this.vehicleStore.vehicles().find(v => v.id === id);
  });

  openEdit() {
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  deleteVehicle() {
    const vehicle = this.vehicle();
    if (!vehicle) return;

    this.vehicleStore.remove(vehicle.id).subscribe({
      next: () => this.router.navigate(['/dashboard'], { replaceUrl: true })
    });
  }
}
