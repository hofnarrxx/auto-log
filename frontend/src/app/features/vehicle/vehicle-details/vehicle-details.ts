import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VehicleStore } from '../vehicle-store';
import { VehicleForm } from '../vehicle-form/vehicle-form';
import { Modal } from '../../../shared/ui/modal/modal';

@Component({
  selector: 'app-vehicle-details',
  imports: [VehicleForm, Modal],
  templateUrl: './vehicle-details.html',
  styleUrl: './vehicle-details.css',
})
export class VehicleDetails {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vehicleStore = inject(VehicleStore);
  showModal = signal(false);

  vehicle = this.getVehicle();

  private getVehicle() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    return this.vehicleStore.vehicles().find(v => v.id === id);
  }

  openEdit() {
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.vehicle = this.getVehicle();
  }

  deleteVehicle() {
    if (!this.vehicle) return;

    this.vehicleStore.remove(this.vehicle.id);
    this.router.navigate(['/']);
  }
}
