import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CategoryLabelPipe, DateFormatPipe, MoneyPipe } from '../../shared/pipes';
import { MaintenanceListComponent } from '../../shared/ui/maintenance-list/maintenance-list.component';
import { getMaintenanceWarningRecordIds } from '../../shared/utils/maintenance-list.utils';
import type { MaintenanceRecord } from '../vehicle/models';

@Component({
  selector: 'app-shared-vehicle-maintenance-tab',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MaintenanceListComponent,
    CategoryLabelPipe,
    DateFormatPipe,
    MoneyPipe,
  ],
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
    getMaintenanceWarningRecordIds(this.serviceRecords(), (record) => record.serviceDate)
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
