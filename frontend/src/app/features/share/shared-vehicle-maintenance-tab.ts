import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationService } from '../../shared/services/notification.service';
import { Modal } from '../../shared/ui/modal/modal';
import { findMileageWarningRecordIds } from '../../shared/utils/mileage.utils';
import { MaintenanceList } from '../vehicle/ui/maintenance-list/maintenance-list';
import { MaintenanceRecordDetails } from '../vehicle/ui/maintenance-record-details/maintenance-record-details';
import type { MaintenanceAttachment, MaintenanceRecord } from '../vehicle/models';
import { PublicShareApi } from './public-share-api';

@Component({
  selector: 'app-shared-vehicle-maintenance-tab',
  imports: [CommonModule, TranslateModule, Modal, MaintenanceList, MaintenanceRecordDetails],
  templateUrl: './shared-vehicle-maintenance-tab.html',
  styleUrl: './shared-vehicle-maintenance-tab.css',
})
export class SharedVehicleMaintenanceTab {
  private readonly publicShareApi = inject(PublicShareApi);
  private readonly notifications = inject(NotificationService);

  @Input({ required: true }) token!: string;

  @Input({ required: true })
  set records(value: MaintenanceRecord[]) {
    this.serviceRecords.set(value ?? []);
  }

  protected readonly error = signal<string | null>(null);
  protected readonly isModalOpen = signal(false);
  protected readonly selectedRecord = signal<MaintenanceRecord | null>(null);

  protected readonly serviceRecords = signal<MaintenanceRecord[]>([]);

  protected readonly mileageWarningRecordIds = computed(() =>
    findMileageWarningRecordIds(this.serviceRecords(), (record) => record.serviceDate)
  );

  protected openRecordDetails(record: MaintenanceRecord) {
    this.selectedRecord.set(record);
    this.isModalOpen.set(true);
  }

  protected closeModal() {
    this.isModalOpen.set(false);
    this.selectedRecord.set(null);
  }

  protected hasMileageWarning(record: MaintenanceRecord): boolean {
    return this.mileageWarningRecordIds().has(record.id);
  }

  protected openAttachment(attachment: MaintenanceAttachment) {
    const record = this.selectedRecord();
    if (!record) {
      return;
    }

    this.publicShareApi
      .getMaintenanceAttachmentDownloadUrl(this.token, record.id, attachment.id)
      .subscribe({
        next: (response) => {
          if (response.downloadUrl) {
            window.open(response.downloadUrl, '_blank', 'noopener');
          }
        },
        error: () => {
          this.notifications.notifyError('sharedVehicle.maintenanceTab.errors.downloadFailed');
        },
      });
  }
}
