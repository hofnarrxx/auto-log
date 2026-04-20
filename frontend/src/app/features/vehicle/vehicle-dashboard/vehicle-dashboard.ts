import { Component, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { VehicleStore } from '../vehicle-store';
import { VehicleForm } from '../vehicle-form/vehicle-form';
import { Modal } from '../../../shared/ui/modal/modal';
import { VehicleDetailsTab } from './details-tab/vehicle-details-tab';
import { VehicleMaintenanceTab } from './maintenance-tab/vehicle-maintenance-tab';
import { VehicleFuelTab } from './fuel-tab/vehicle-fuel-tab';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-vehicle-dashboard',
  imports: [VehicleForm, Modal, VehicleDetailsTab, VehicleMaintenanceTab, VehicleFuelTab],
  templateUrl: './vehicle-dashboard.html',
  styleUrl: './vehicle-dashboard.css',
})
export class VehicleDashboard {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vehicleStore = inject(VehicleStore);
  showEditModal = signal(false);
  showShareModal = signal(false);
  shareLink = signal('');
  isCreatingShareLink = signal(false);
  shareError = signal('');
  copySuccess = signal(false);
  private queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  activeTab = computed<'details' | 'maintenance' | 'fuel'>(() => {
    const tab = this.queryParamMap().get('tab');
    if (tab === 'maintenance') {
      return 'maintenance';
    }

    if (tab === 'fuel') {
      return 'fuel';
    }

    return 'details';
  });

  ngOnInit() {
    this.vehicleStore.load();
  }

  vehicle = computed(() => {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    return this.vehicleStore.vehicles().find(v => v.id === id);
  });

  openEdit() {
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
  }

  createShareLink() {
    const vehicle = this.vehicle();
    if (!vehicle) return;

    this.isCreatingShareLink.set(true);
    this.shareError.set('');
    this.copySuccess.set(false);

    this.vehicleStore.createShareLink(vehicle.id).pipe(
      finalize(() => this.isCreatingShareLink.set(false))
    ).subscribe({
      next: response => {
        this.shareLink.set(`http://localhost:8080/api/public/cars/${response.token}`);
        this.showShareModal.set(true);
      },
      error: () => {
        this.shareError.set('Could not generate a share link. Please try again.');
      }
    });
  }

  closeShareModal() {
    this.showShareModal.set(false);
    this.copySuccess.set(false);
  }

  async copyShareLink() {
    const link = this.shareLink();
    if (!link) return;

    let copied = false;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(link);
        copied = true;
      } catch {
        copied = false;
      }
    }

    if (!copied) {
      copied = this.copyWithFallback(link);
    }

    this.copySuccess.set(copied);
    if (copied) {
      window.setTimeout(() => this.copySuccess.set(false), 2000);
    }
  }

  private copyWithFallback(text: string): boolean {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      return document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  }

  deleteVehicle() {
    const vehicle = this.vehicle();
    if (!vehicle) return;

    this.vehicleStore.remove(vehicle.id).subscribe({
      next: () => this.router.navigate(['/dashboard'], { replaceUrl: true })
    });
  }
}
