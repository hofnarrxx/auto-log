import { Component, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ShareLinkResponse, VehicleStore } from '../vehicle-store';
import { VehicleForm } from '../vehicle-form/vehicle-form';
import { Modal } from '../../../shared/ui/modal/modal';
import { VehicleDetailsTab } from './details-tab/vehicle-details-tab';
import { VehicleMaintenanceTab } from './maintenance-tab/vehicle-maintenance-tab';
import { VehicleFuelTab } from './fuel-tab/vehicle-fuel-tab';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-vehicle-dashboard',
  imports: [VehicleForm, Modal, VehicleDetailsTab, VehicleMaintenanceTab, VehicleFuelTab, TranslateModule],
  templateUrl: './vehicle-dashboard.html',
  styleUrl: './vehicle-dashboard.css',
})
export class VehicleDashboard {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vehicleStore = inject(VehicleStore);
  showEditModal = signal(false);
  showShareModal = signal(false);
  shareLinks = signal<ShareLinkResponse[]>([]);
  isLoadingShareLinks = signal(false);
  isCreatingShareLink = signal(false);
  deletingShareLinkId = signal<number | null>(null);
  shareError = signal('');
  copySuccess = signal(false);
  private readonly maxActiveShareLinks = 1;
  readonly canCreateShareLink = computed(() => this.shareLinks().length < this.maxActiveShareLinks);
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

  openShareModal() {
    const vehicle = this.vehicle();
    if (!vehicle) return;

    this.isLoadingShareLinks.set(true);
    this.shareError.set('');
    this.copySuccess.set(false);
    this.shareLinks.set([]);

    this.vehicleStore.listShareLinks(vehicle.id).pipe(
      finalize(() => this.isLoadingShareLinks.set(false))
    ).subscribe({
      next: response => {
        this.shareLinks.set(this.filterActiveLinks(response));
        this.showShareModal.set(true);
      },
      error: () => {
        this.shareError.set('vehicle.dashboard.share.errors.load');
        this.showShareModal.set(true);
      }
    });
  }

  closeShareModal() {
    this.showShareModal.set(false);
    this.copySuccess.set(false);
    this.shareError.set('');
    this.shareLinks.set([]);
    this.deletingShareLinkId.set(null);
  }

  async copyShareLink(token: string) {
    const link = this.shareUrl(token);
    if (!link) {
      return;
    }

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

  deleteShareLink(linkId: number) {
    if (this.deletingShareLinkId() === linkId) {
      return;
    }

    this.deletingShareLinkId.set(linkId);
    this.shareError.set('');

    this.vehicleStore.revokeShareLink(linkId).pipe(
      finalize(() => this.deletingShareLinkId.set(null))
    ).subscribe({
      next: () => {
        this.shareLinks.update(links => links.filter(link => link.id !== linkId));
      },
      error: () => {
        this.shareError.set('vehicle.dashboard.share.errors.delete');
      }
    });
  }

  createShareLink() {
    const vehicle = this.vehicle();
    if (!vehicle || !this.canCreateShareLink()) {
      return;
    }

    this.isCreatingShareLink.set(true);
    this.shareError.set('');
    this.copySuccess.set(false);

    this.vehicleStore.createShareLink(vehicle.id).pipe(
      finalize(() => this.isCreatingShareLink.set(false))
    ).subscribe({
      next: response => {
        this.shareLinks.update(links => [response, ...links].slice(0, this.maxActiveShareLinks));
      },
      error: () => {
        this.shareError.set('vehicle.dashboard.share.errors.generate');
      }
    });
  }

  remainingTime(expiresAt: string | null): string {
    if (!expiresAt) {
      return '0 d 00 h';
    }

    const expiresAtMs = new Date(expiresAt).getTime();
    const nowMs = Date.now();
    const diffMs = Math.max(0, expiresAtMs - nowMs);
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    return `${days} d ${hours.toString().padStart(2, '0')} h`;
  }

  shareUrl(token: string): string {
    return token ? `${window.location.origin}/share/${token}` : '';
  }

  private filterActiveLinks(links: ShareLinkResponse[]): ShareLinkResponse[] {
    const now = Date.now();
    return links.filter(link => {
      if (link.revoked) {
        return false;
      }

      if (!link.expiresAt) {
        return true;
      }

      return new Date(link.expiresAt).getTime() > now;
    });
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
