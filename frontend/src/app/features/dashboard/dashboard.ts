import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { VehicleForm, VehicleStore } from '@features/vehicle';
import { Modal } from '@shared/ui/modal/modal';
import { AuthStore } from '../../core/auth/auth-store';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule, VehicleForm, Modal, TranslateModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private vehicleStore = inject(VehicleStore);
  private authStore = inject(AuthStore);

  showModal = signal(false);

  vehicles = this.vehicleStore.vehicles;
  isLoading = this.vehicleStore.isLoading;
  error = this.vehicleStore.error;
  protected readonly isDemo = this.authStore.isDemo;

  ngOnInit() {
    this.vehicleStore.load();
  }

  openModal() {
    if (this.isDemo()) return;
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  deleteVehicle(id: string) {
    this.vehicleStore.remove(id).subscribe();
  }
}
