import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { ClipboardService } from '../../../../shared/services/clipboard.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Modal } from '../../../../shared/ui/modal/modal';
import type { ShareLinkResponse } from '../../models';
import { VehicleStore } from '../../vehicle-store';

/**
 * Self-contained share-link management dialog for a single vehicle: loads existing links on
 * init, and owns creating/copying/revoking them. The dashboard only decides when to show it.
 */
@Component({
  selector: 'app-share-link-modal',
  imports: [Modal, TranslateModule],
  templateUrl: './share-link-modal.html',
  styleUrl: './share-link-modal.css',
})
export class ShareLinkModal implements OnInit {
  private readonly vehicleStore = inject(VehicleStore);
  private readonly notifications = inject(NotificationService);
  private readonly clipboard = inject(ClipboardService);
  private readonly maxActiveShareLinks = 1;

  @Input({ required: true }) vehicleId!: number;
  @Output() closed = new EventEmitter<void>();

  protected readonly shareLinks = signal<ShareLinkResponse[]>([]);
  protected readonly isLoadingShareLinks = signal(false);
  protected readonly isCreatingShareLink = signal(false);
  protected readonly deletingShareLinkId = signal<number | null>(null);
  protected readonly shareAttachments = signal(true);
  protected readonly canCreateShareLink = computed(
    () => this.shareLinks().length < this.maxActiveShareLinks
  );

  ngOnInit() {
    this.isLoadingShareLinks.set(true);

    this.vehicleStore
      .listShareLinks(this.vehicleId)
      .pipe(finalize(() => this.isLoadingShareLinks.set(false)))
      .subscribe({
        next: (response) => this.shareLinks.set(this.filterActiveLinks(response)),
        error: () => this.notifications.notifyError('vehicle.dashboard.share.errors.load'),
      });
  }

  protected close() {
    this.closed.emit();
  }

  protected async copyShareLink(token: string) {
    const link = this.shareUrl(token);
    if (!link) {
      return;
    }

    const copied = await this.clipboard.copy(link);
    if (copied) {
      this.notifications.notifySuccess('vehicle.dashboard.share.copySuccess');
    }
  }

  protected deleteShareLink(linkId: number) {
    if (this.deletingShareLinkId() === linkId) {
      return;
    }

    this.deletingShareLinkId.set(linkId);

    this.vehicleStore
      .revokeShareLink(linkId)
      .pipe(finalize(() => this.deletingShareLinkId.set(null)))
      .subscribe({
        next: () => {
          this.shareLinks.update((links) => links.filter((link) => link.id !== linkId));
        },
        error: () => {
          this.notifications.notifyError('vehicle.dashboard.share.errors.delete');
        },
      });
  }

  protected createShareLink() {
    if (!this.canCreateShareLink()) {
      return;
    }

    this.isCreatingShareLink.set(true);

    this.vehicleStore
      .createShareLink(this.vehicleId, this.shareAttachments())
      .pipe(finalize(() => this.isCreatingShareLink.set(false)))
      .subscribe({
        next: (response) => {
          this.shareLinks.update((links) =>
            [response, ...links].slice(0, this.maxActiveShareLinks)
          );
        },
        error: () => {
          this.notifications.notifyError('vehicle.dashboard.share.errors.generate');
        },
      });
  }

  protected remainingTime(expiresAt: string | null): string {
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

  protected shareUrl(token: string): string {
    return token ? `${window.location.origin}/share/${token}` : '';
  }

  protected onShareAttachmentsChange(event: Event) {
    this.shareAttachments.set((event.target as HTMLInputElement).checked);
  }

  private filterActiveLinks(links: ShareLinkResponse[]): ShareLinkResponse[] {
    const now = Date.now();
    return links.filter((link) => {
      if (link.revoked) {
        return false;
      }

      if (!link.expiresAt) {
        return true;
      }

      return new Date(link.expiresAt).getTime() > now;
    });
  }
}
