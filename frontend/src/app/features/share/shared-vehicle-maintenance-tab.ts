import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule,
} from 'lucide-angular';
import { CurrencyService } from '../../shared/services/currency.service';
import { MaintenanceListComponent } from '../../shared/ui/maintenance-list/maintenance-list.component';
import { getMaintenanceCategoryLabel, getMaintenanceWarningRecordIds } from '../../shared/utils/maintenance-list.utils';
import type { SharedMaintenanceEntry } from './shared-vehicle-model';

@Component({
  selector: 'app-shared-vehicle-maintenance-tab',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    LucideAngularModule,
    MaintenanceListComponent,
  ],
  templateUrl: './shared-vehicle-maintenance-tab.html',
  styleUrl: './shared-vehicle-maintenance-tab.css',
})
export class SharedVehicleMaintenanceTab {
  private readonly currencyService = inject(CurrencyService);

  @Input({ required: true })
  set records(value: SharedMaintenanceEntry[]) {
    this.serviceRecords.set(value ?? []);
  }

  protected readonly error = signal<string | null>(null);
  protected readonly isModalOpen = signal(false);
  protected readonly selectedRecord = signal<SharedMaintenanceEntry | null>(null);

  protected readonly serviceRecords = signal<SharedMaintenanceEntry[]>([]);

  protected readonly mileageWarningRecordIds = computed(() =>
    getMaintenanceWarningRecordIds(this.serviceRecords(), record => record.serviceDate)
  );

  protected openRecordDetails(record: SharedMaintenanceEntry) {
    this.selectedRecord.set(record);
    this.isModalOpen.set(true);
  }

  protected closeModal() {
    this.isModalOpen.set(false);
    this.selectedRecord.set(null);
  }

  protected categoryLabel(category: string): string {
    return getMaintenanceCategoryLabel(category);
  }

  protected formatMoney(value: number | null, currency?: string): string {
    if (value === null || value === undefined) {
      return '-';
    }
    const currencyCode = currency || this.currencyService.selectedCurrency();
    return this.currencyService.formatCurrency(value, currencyCode);
  }

  protected formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return isoString;
    }

    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = `${date.getFullYear()}`;
    const hour = `${date.getHours()}`.padStart(2, '0');
    const minute = `${date.getMinutes()}`.padStart(2, '0');

    return `${day}.${month}.${year} ${hour}:${minute}`;
  }

  protected formatDate(serviceDate: string): string {
    const [year, month, day] = serviceDate.split('-');
    if (!year || !month || !day) {
      return serviceDate;
    }
    return `${day}.${month}.${year}`;
  }

  protected hasMileageWarning(record: SharedMaintenanceEntry): boolean {
    return this.mileageWarningRecordIds().has(record.id);
  }
}
