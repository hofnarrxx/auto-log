import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, Input, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { CurrencyService } from '../../../../shared/services/currency.service';

interface FuelRecord {
  id: number;
  vehicleId: number;
  date: string;
  mileage: number | null;
  cost: number | null;
  amount: number | null;
  gasStation: string | null;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-vehicle-fuel-tab',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehicle-fuel-tab.html',
  styleUrl: './vehicle-fuel-tab.css',
})
export class VehicleFuelTab {
  private readonly http = inject(HttpClient);
  private readonly currencyService = inject(CurrencyService);
  private readonly vehicleApi = 'http://localhost:8080/vehicles';

  readonly form = new FormGroup({
    date: new FormControl('', Validators.required),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    cost: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    mileage: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    gasStation: new FormControl('', [Validators.maxLength(50)]),
    currency: new FormControl<string>('', Validators.required),
  });

  @Input({ required: true })
  set vehicleId(value: number) {
    this.currentVehicleId = value;
    this.loadFuelRecords();
  }

  private currentVehicleId: number | null = null;

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly isModalOpen = signal(false);
  protected readonly isCreateMode = signal(false);
  protected readonly isEditMode = signal(false);
  protected readonly selectedRecord = signal<FuelRecord | null>(null);
  protected readonly fuelRecords = signal<FuelRecord[]>([]);

  protected formatDate(date: string | null | undefined): string {
    if (!date) {
      return '-';
    }

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }

    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  protected formatMoney(value: number | null | undefined, currency?: string): string {
    if (value === null || value === undefined) {
      return '-';
    }

    const currencyCode = currency || this.currencyService.selectedCurrency();
    return this.currencyService.formatCurrency(value, currencyCode);
  }

  protected formatFuelAmount(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) {
      return '-';
    }

    return `${amount.toFixed(2)} L`;
  }

  protected openCreateModal() {
    this.isCreateMode.set(true);
    this.isEditMode.set(false);
    this.selectedRecord.set(null);
    this.actionError.set(null);
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
    this.actionError.set(null);
    this.isModalOpen.set(true);
  }

  protected startEditSelectedRecord() {
    const record = this.selectedRecord();
    if (!record) {
      return;
    }

    this.isCreateMode.set(true);
    this.isEditMode.set(true);
    this.actionError.set(null);
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
    this.actionError.set(null);
  }

  protected modalTitle(): string {
    if (this.isEditMode()) {
      return 'Edit Fuel Record';
    }

    if (this.isCreateMode()) {
      return 'Add Fuel Record';
    }

    return 'Fuel Record Details';
  }

  protected saveButtonLabel(): string {
    if (this.isSaving()) {
      return this.isEditMode() ? 'Updating...' : 'Saving...';
    }

    return this.isEditMode() ? 'Update' : 'Save';
  }

  protected formatDateTime(isoString: string | null | undefined): string {
    if (!isoString) {
      return '-';
    }

    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected saveRecord() {
    if (this.form.invalid || this.currentVehicleId === null) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    if (!payload) {
      this.actionError.set('Please enter valid data before saving.');
      return;
    }

    this.isSaving.set(true);
    this.actionError.set(null);

    const selected = this.selectedRecord();
    const request$ = this.isEditMode() && selected
      ? this.http.put<FuelRecord>(
          `${this.vehicleApi}/${this.currentVehicleId}/fuel/${selected.id}`,
          payload
        )
      : this.http.post<FuelRecord>(`${this.vehicleApi}/${this.currentVehicleId}/fuel`, payload);

    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.closeModal();
        this.loadFuelRecords();
      },
      error: () => {
        this.actionError.set('Unable to save fuel record. Please try again.');
      },
    });
  }

  protected deleteSelectedRecord() {
    const selected = this.selectedRecord();
    if (!selected || this.currentVehicleId === null) {
      return;
    }

    this.isDeleting.set(true);
    this.actionError.set(null);

    this.http
      .delete<void>(`${this.vehicleApi}/${this.currentVehicleId}/fuel/${selected.id}`)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          this.closeModal();
          this.loadFuelRecords();
        },
        error: () => {
          this.actionError.set('Unable to delete fuel record. Please try again.');
        },
      });
  }

  private loadFuelRecords() {
    if (this.currentVehicleId === null) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.http
      .get<FuelRecord[]>(`${this.vehicleApi}/${this.currentVehicleId}/fuel`)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: records => {
          const sorted = [...records].sort((a, b) => {
            const left = new Date(b.date).getTime();
            const right = new Date(a.date).getTime();
            return left - right;
          });
          this.fuelRecords.set(sorted);
        },
        error: () => {
          this.error.set('Failed to load fuel records.');
          this.fuelRecords.set([]);
        },
      });
  }

  private buildPayload() {
    const date = (this.form.controls.date.value ?? '').trim();
    const gasStationValue = (this.form.controls.gasStation.value ?? '').trim();
    const amountValue = this.form.controls.amount.value;
    const costValue = this.form.controls.cost.value;
    const mileageValue = this.form.controls.mileage.value;
    const currencyValue = (this.form.controls.currency.value ?? '').trim();

    if (!date || gasStationValue.length > 50 || !currencyValue) {
      return null;
    }

    const amount =
      amountValue === null || amountValue === undefined || amountValue === ('' as any)
        ? null
        : Number(amountValue);

    const cost =
      costValue === null || costValue === undefined || costValue === ('' as any)
        ? null
        : Number(costValue);

    const mileage =
      mileageValue === null || mileageValue === undefined || mileageValue === ('' as any)
        ? null
        : Math.trunc(Number(mileageValue));

    if (
      amount === null ||
      cost === null ||
      mileage === null ||
      Number.isNaN(amount) ||
      Number.isNaN(cost) ||
      Number.isNaN(mileage)
    ) {
      return null;
    }

    return {
      date,
      amount,
      cost,
      mileage,
      gasStation: gasStationValue || null,
      currency: currencyValue,
    };
  }
}
