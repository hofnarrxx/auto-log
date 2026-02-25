import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { VehicleForm } from '../vehicle/vehicle-form/vehicle-form';
import { VehicleStore } from '../vehicle/vehicle-store';
import { Modal } from '../../shared/ui/modal/modal';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule, VehicleForm, Modal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private vehicleStore = inject(VehicleStore);
  vehicles = this.vehicleStore.vehicles;

  showModal = signal(false);

  openModal() {
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  deleteVehicle(id: number) {
    this.vehicleStore.remove(id);
  }
}
