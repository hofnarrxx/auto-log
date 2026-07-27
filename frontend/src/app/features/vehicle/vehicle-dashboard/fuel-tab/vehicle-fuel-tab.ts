import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DateFormatPipe, MoneyPipe } from '../../../../shared/pipes';
import { CurrencyService } from '../../../../shared/services/currency.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { LucideAngularModule } from 'lucide-angular';
import { FuelListComponent } from '../../../../shared/ui/fuel-list/fuel-list.component';
import { formatFuelAmount, getFuelPricePerUnit } from '../../../../shared/utils/fuel-record.utils';
import { parseIntegerField, parseNumericField } from '../../../../shared/utils/form-value.utils';
import { findMileageWarningRecordIds } from '../../../../shared/utils/mileage.utils';
import type { FuelRecord, FuelRecordPayload } from '../../models';
import { FuelStore } from '../../fuel-store';

@Component({
  selector: 'app-vehicle-fuel-tab',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    LucideAngularModule,
    FuelListComponent,
    DateFormatPipe,
    MoneyPipe,
  ],
  templateUrl: './vehicle-fuel-tab.html',
  styleUrl: './vehicle-fuel-tab.css',
})
export class VehicleFuelTab {
  private readonly fuelStore = inject(FuelStore);
  private readonly currencyService = inject(CurrencyService);
  private readonly notifications = inject(NotificationService);

  readonly form = new FormGroup({
    date: new FormControl('', Validators.required),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    cost: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    mileage: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    gasStation: new FormControl('', [Validators.maxLength(50)]),
    currency: new FormControl<string>('', Validators.required),
  });

  @Input({ required: true })
  set vehicleId(value: number) {
    this.currentVehicleId = value;
    this.fuelStore.load(value);
  }

  private currentVehicleId: number | null = null;

  protected readonly isLoading = this.fuelStore.isLoading;
  protected readonly error = this.fuelStore.error;
  protected readonly isSaving = this.fuelStore.isSaving;
  protected readonly isDeleting = this.fuelStore.isDeleting;
  protected readonly fuelRecords = this.fuelStore.records;
  protected readonly isModalOpen = signal(false);
  protected readonly isCreateMode = signal(false);
  protected readonly isEditMode = signal(false);
  protected readonly selectedRecord = signal<FuelRecord | null>(null);
  protected readonly totalFuelCostByCurrency = computed(() => {
    const totals = new Map<string, number>();

    this.fuelRecords().forEach((record) => {
      if (record.cost === null) {
        return;
      }

      const currency = this.getRecordCurrency(record);
      totals.set(currency, (totals.get(currency) ?? 0) + record.cost);
    });

    return Array.from(totals.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([currency, total]) => this.currencyService.formatCurrency(total, currency))
      .join(' | ');
  });
  protected readonly mileageWarningRecordIds = computed(() =>
    findMileageWarningRecordIds(this.fuelRecords(), (record) => record.date)
  );

  protected formatFuelAmount(amount: number | null | undefined): string {
    return formatFuelAmount(amount);
  }

  protected formatPricePerLitre(
    cost: number | null | undefined,
    amount: number | null | undefined,
    currency?: string
  ): string {
    const pricePerLitre = getFuelPricePerUnit({ cost: cost ?? null, amount: amount ?? null });

    if (pricePerLitre === null) {
      return '-';
    }

    return `${this.currencyService.formatCurrency(pricePerLitre, currency)} / L`;
  }

  protected hasMileageWarning(record: FuelRecord): boolean {
    return this.mileageWarningRecordIds().has(record.id);
  }

  protected modalTitle(): string {
    if (this.isEditMode()) {
      return 'vehicle.fuelTab.modalTitle.edit';
    }

    if (this.isCreateMode()) {
      return 'vehicle.fuelTab.modalTitle.add';
    }

    return 'vehicle.fuelTab.modalTitle.details';
  }

  protected saveButtonLabel(): string {
    if (this.isSaving()) {
      return this.isEditMode() ? 'common.updating' : 'common.saving';
    }

    return this.isEditMode() ? 'common.update' : 'common.save';
  }

  protected openCreateModal() {
    this.isCreateMode.set(true);
    this.isEditMode.set(false);
    this.selectedRecord.set(null);
    this.form.reset({
      date: '',
      amount: null,
      cost: null,
      mileage: null,
      gasStation: '',
      currency: this.currencyService.selectedCurrency(),
    });
    this.isModalOpen.set(true);
  }

  protected openRecordDetails(record: FuelRecord) {
    this.isCreateMode.set(false);
    this.isEditMode.set(false);
    this.selectedRecord.set(record);
    this.isModalOpen.set(true);
  }

  protected startEditSelectedRecord() {
    const record = this.selectedRecord();
    if (!record) {
      return;
    }

    this.isCreateMode.set(true);
    this.isEditMode.set(true);
    this.form.reset({
      date: record.date,
      amount: record.amount,
      cost: record.cost,
      mileage: record.mileage,
      gasStation: record.gasStation ?? '',
      currency: record.currency || this.currencyService.selectedCurrency(),
    });
  }

  protected closeModal() {
    this.isModalOpen.set(false);
    this.isCreateMode.set(false);
    this.isEditMode.set(false);
    this.selectedRecord.set(null);
  }

  protected saveRecord() {
    if (this.form.invalid || this.currentVehicleId === null) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    if (!payload) {
      this.notifications.notifyError('vehicle.fuelTab.errors.invalidData');
      return;
    }

    const selected = this.selectedRecord();

    this.fuelStore
      .save(this.currentVehicleId, payload, this.isEditMode() && selected ? selected.id : undefined)
      .subscribe({
        next: () => {
          this.closeModal();
        },
        error: () => {
          this.notifications.notifyError('vehicle.fuelTab.errors.saveFailed');
        },
      });
  }

  protected deleteSelectedRecord() {
    const selected = this.selectedRecord();
    if (!selected || this.currentVehicleId === null) {
      return;
    }

    this.fuelStore.delete(this.currentVehicleId, selected.id).subscribe({
      next: () => {
        this.closeModal();
      },
      error: () => {
        this.notifications.notifyError('vehicle.fuelTab.errors.deleteFailed');
      },
    });
  }

  private buildPayload(): FuelRecordPayload | null {
    const date = (this.form.controls.date.value ?? '').trim();
    const gasStation = (this.form.controls.gasStation.value ?? '').trim();
    const currency = (this.form.controls.currency.value ?? '').trim();

    if (!date || gasStation.length > 50 || !currency) {
      return null;
    }

    const amount = parseNumericField(this.form.controls.amount.value);
    const cost = parseNumericField(this.form.controls.cost.value);
    const mileage = parseIntegerField(this.form.controls.mileage.value);

    if (amount.kind !== 'number' || cost.kind !== 'number' || mileage.kind !== 'number') {
      return null;
    }

    if (amount.value <= 0) {
      return null;
    }

    return {
      date,
      amount: amount.value,
      cost: cost.value,
      mileage: mileage.value,
      gasStation: gasStation || null,
      currency,
    };
  }

  private getRecordCurrency(record: FuelRecord): string {
    const fallbackCurrency = this.currencyService.selectedCurrency();
    return (record.currency || fallbackCurrency).trim().toUpperCase();
  }
}
