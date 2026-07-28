import { CommonModule } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Modal } from '../../shared/ui/modal/modal';
import { findMileageWarningRecordIds } from '../../shared/utils/mileage.utils';
import { MaintenanceList } from '../vehicle/ui/maintenance-list/maintenance-list';
import { MaintenanceRecordDetails } from '../vehicle/ui/maintenance-record-details/maintenance-record-details';
import type { MaintenanceRecord } from '../vehicle/models';

@Component({
  selector: 'app-shared-vehicle-maintenance-tab',
  imports: [CommonModule, TranslateModule, Modal, MaintenanceList, MaintenanceRecordDetails],
  templateUrl: './shared-vehicle-maintenance-tab.html',
  styleUrl: './shared-vehicle-maintenance-tab.css',
})
export class SharedVehicleMaintenanceTab {
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
}
