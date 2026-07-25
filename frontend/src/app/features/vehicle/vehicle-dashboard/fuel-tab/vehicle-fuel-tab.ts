import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { DateFormatPipe, MoneyPipe } from '../../../../shared/pipes';
import { CurrencyService } from '../../../../shared/services/currency.service';
import { LucideAngularModule } from 'lucide-angular';
import { FuelListComponent } from '../../../../shared/ui/fuel-list/fuel-list.component';
import type { FuelRecord } from '../../models';

type SortOption =
  | 'newest'
  | 'oldest'
  | 'price-low-high'
  | 'price-high-low'
  | 'price-per-unit-low-high'
  | 'price-per-unit-high-low';

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
  private readonly http = inject(HttpClient);
  private readonly currencyService = inject(CurrencyService);
  private readonly vehicleApi = 'http://localhost:8080/vehicles';

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
  protected readonly gasStationSearch = signal('');
  protected readonly selectedSort = signal<SortOption>('newest');
  protected readonly hasAnyRecords = computed(() => this.fuelRecords().length > 0);
  protected readonly totalFuelCostByCurrency = computed(() => {
    const totals = new Map<string, number>();

    this.fuelRecords().forEach(record => {
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
  protected readonly filteredFuelRecords = computed(() =>
    this.fuelRecords().filter(record => this.matchesGasStationFilter(record))
  );
  protected readonly visibleFuelRecords = computed(() =>
    [...this.filteredFuelRecords()].sort((left, right) => this.compareRecords(left, right))
  );
  protected readonly mileageWarningRecordIds = computed(() =>
    this.findMileageWarningRecordIds(this.fuelRecords(), record => record.date)
  );

  protected formatFuelAmount(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) {
      return '-';
    }

    return `${amount.toFixed(2)} L`;
  }

  protected formatPricePerLitre(
    cost: number | null | undefined,
    amount: number | null | undefined,
    currency?: string
  ): string {
    if (
      cost === null ||
      cost === undefined ||
      amount === null ||
      amount === undefined ||
      amount <= 0
    ) {
      return '-';
    }

    const pricePerLitre = cost / amount;
    return `${this.currencyService.formatCurrency(pricePerLitre, currency)} / L`;
  }

  protected hasMileageWarning(record: FuelRecord): boolean {
    return this.mileageWarningRecordIds().has(record.id);
  }

  protected onGasStationSearchChange(rawValue: string) {
    this.gasStationSearch.set(rawValue.trimStart());
  }

  protected onSortChange(rawValue: string) {
    if (
      rawValue !== 'newest' &&
      rawValue !== 'oldest' &&
      rawValue !== 'price-low-high' &&
      rawValue !== 'price-high-low' &&
      rawValue !== 'price-per-unit-low-high' &&
      rawValue !== 'price-per-unit-high-low'
    ) {
      return;
    }

    this.selectedSort.set(rawValue);
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

  protected saveRecord() {
    if (this.form.invalid || this.currentVehicleId === null) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    if (!payload) {
      this.actionError.set('vehicle.fuelTab.errors.invalidData');
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
        this.actionError.set('vehicle.fuelTab.errors.saveFailed');
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
          this.actionError.set('vehicle.fuelTab.errors.deleteFailed');
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
          this.error.set('vehicle.fuelTab.errors.loadFailed');
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
      amount <= 0 ||
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

  private matchesGasStationFilter(record: FuelRecord): boolean {
    const query = this.gasStationSearch().trim().toLowerCase();
    if (!query) {
      return true;
    }

    const station = (record.gasStation ?? '').toLowerCase();
    return station.includes(query);
  }

  private compareRecords(left: FuelRecord, right: FuelRecord): number {
    const sort = this.selectedSort();

    if (sort === 'oldest') {
      return this.toTimestamp(left.date) - this.toTimestamp(right.date);
    }

    if (sort === 'price-low-high') {
      return this.compareNullableNumbers(left.cost, right.cost, 'asc') ||
        (this.toTimestamp(right.date) - this.toTimestamp(left.date));
    }

    if (sort === 'price-high-low') {
      return this.compareNullableNumbers(left.cost, right.cost, 'desc') ||
        (this.toTimestamp(right.date) - this.toTimestamp(left.date));
    }

    if (sort === 'price-per-unit-low-high') {
      return this.compareNullableNumbers(
        this.pricePerUnit(left),
        this.pricePerUnit(right),
        'asc'
      ) || (this.toTimestamp(right.date) - this.toTimestamp(left.date));
    }

    if (sort === 'price-per-unit-high-low') {
      return this.compareNullableNumbers(
        this.pricePerUnit(left),
        this.pricePerUnit(right),
        'desc'
      ) || (this.toTimestamp(right.date) - this.toTimestamp(left.date));
    }

    return this.toTimestamp(right.date) - this.toTimestamp(left.date);
  }

  private compareNullableNumbers(
    left: number | null,
    right: number | null,
    direction: 'asc' | 'desc'
  ): number {
    if (left === null && right === null) {
      return 0;
    }

    if (left === null) {
      return 1;
    }

    if (right === null) {
      return -1;
    }

    return direction === 'asc' ? left - right : right - left;
  }

  private pricePerUnit(record: FuelRecord): number | null {
    if (record.cost === null || record.amount === null || record.amount <= 0) {
      return null;
    }

    return record.cost / record.amount;
  }

  private getRecordCurrency(record: FuelRecord): string {
    const fallbackCurrency = this.currencyService.selectedCurrency();
    return (record.currency || fallbackCurrency).trim().toUpperCase();
  }

  private findMileageWarningRecordIds<T extends { id: number; mileage: number | null }>(
    records: T[],
    getDate: (record: T) => string
  ): Set<number> {
    const sorted = [...records].sort(
      (left, right) => this.toTimestamp(getDate(left)) - this.toTimestamp(getDate(right))
    );

    const warnings = new Set<number>();
    let maxMileageSeen: number | null = null;

    sorted.forEach(record => {
      const mileage = record.mileage;
      if (mileage === null) {
        return;
      }

      if (maxMileageSeen !== null && mileage < maxMileageSeen) {
        warnings.add(record.id);
        return;
      }

      maxMileageSeen = maxMileageSeen === null ? mileage : Math.max(maxMileageSeen, mileage);
    });

    return warnings;
  }

  private toTimestamp(date: string): number {
    const timestamp = new Date(`${date}T00:00:00`).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }
}
