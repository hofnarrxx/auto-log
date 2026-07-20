import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, map, of, switchMap, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule,
} from 'lucide-angular';
import { CurrencyService } from '../../../../shared/services/currency.service';
import { AttachmentService } from '../../services/attachment.service';

interface MaintenanceAttachment {
  id: number;
  fileName: string;
  contentType: string | null;
  sizeBytes: number | null;
  url: string | null;
  createdAt: string;
}

interface ServiceRecord {
  id: number;
  vehicleId: number;
  serviceDate: string;
  title: string | null;
  mileage: number | null;
  category: string;
  description: string;
  cost: number | null;
  currency?: string;
  attachments?: MaintenanceAttachment[];
  createdAt: string;
  updatedAt: string;
}

interface DownloadUrlResponse {
  downloadUrl: string;
}

type ModalMode = 'closed' | 'create' | 'view' | 'edit';
type SortOption = 'newest' | 'oldest' | 'price-low-high' | 'price-high-low';

@Component({
  selector: 'app-vehicle-maintenance-tab',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    TranslateModule,
    LucideAngularModule,
  ],
  templateUrl: './vehicle-maintenance-tab.html',
  styleUrl: './vehicle-maintenance-tab.css',
})
export class VehicleMaintenanceTab {
  protected readonly allCurrenciesOption = 'All';

  private readonly http = inject(HttpClient);
  private readonly currencyService = inject(CurrencyService);
  private readonly attachmentService = inject(AttachmentService);
  private readonly vehicleApi = 'http://localhost:8080/vehicles';
  private readonly metadataApi = 'http://localhost:8080/metadata/maintenance/categories';

  readonly form = new FormGroup({
    serviceDate: new FormControl('', Validators.required),
    title: new FormControl('', [Validators.required, Validators.maxLength(50)]),
    mileage: new FormControl<number | null>(null, [Validators.min(0), Validators.required]),
    category: new FormControl('', Validators.required),
    description: new FormControl('', [Validators.maxLength(200)]),
    cost: new FormControl<number | null>(null, [Validators.min(0), Validators.required]),
    currency: new FormControl<string>('', Validators.required),
  });

  @Input({ required: true })
  set vehicleId(value: number) {
    this.currentVehicleId = value;
    this.loadServiceRecords();
  }

  private currentVehicleId: number | null = null;

  protected readonly categories = signal<string[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly isFilterModalOpen = signal(false);
  protected readonly modalMode = signal<ModalMode>('closed');
  protected readonly selectedRecord = signal<ServiceRecord | null>(null);
  protected readonly pendingAttachments = signal<File[]>([]);
  protected readonly selectedCategories = signal<string[]>([]);
  protected readonly minPriceLimit = signal(0);
  protected readonly maxPriceLimit = signal(0);
  protected readonly selectedCurrencyFilter = signal(this.allCurrenciesOption);
  protected readonly selectedSort = signal<SortOption>('newest');
  protected readonly titleSearch = signal('');

  private readonly serviceRecords = signal<ServiceRecord[]>([]);
  private filtersInitialized = false;

  protected readonly isModalOpen = computed(() => this.modalMode() !== 'closed');
  protected readonly isFormMode = computed(() => {
    const mode = this.modalMode();
    return mode === 'create' || mode === 'edit';
  });

  protected readonly availableFilterCategories = computed(() => {
    const unique = new Set<string>([
      ...this.categories(),
      ...this.serviceRecords().map(record => record.category),
    ]);

    return Array.from(unique);
  });

  protected readonly maxAvailablePrice = computed(() => {
    const costs = this.getRecordsForSelectedCurrencyFilter()
      .map(record => record.cost)
      .filter((cost): cost is number => cost !== null);

    if (!costs.length) {
      return 0;
    }

    return Math.ceil(Math.max(...costs));
  });

  protected readonly minAvailablePrice = computed(() => {
    const costs = this.getRecordsForSelectedCurrencyFilter()
      .map(record => record.cost)
      .filter((cost): cost is number => cost !== null);

    if (!costs.length) {
      return 0;
    }

    return Math.floor(Math.min(...costs));
  });

  protected readonly allCategoriesChecked = computed(() => {
    const categories = this.availableFilterCategories();
    if (!categories.length) {
      return true;
    }

    const selected = new Set(this.selectedCategories());
    return categories.every(category => selected.has(category));
  });

  protected readonly availableFilterCurrencies = computed(() => {
    const unique = new Set<string>(
      this.serviceRecords()
        .map(record => this.getRecordCurrency(record))
        .filter(currency => !!currency)
    );

    const selected = this.selectedCurrencyFilter();
    if (selected !== this.allCurrenciesOption) {
      unique.add(selected);
    }

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  });

  protected readonly hasAnyRecords = computed(() => this.serviceRecords().length > 0);
  protected readonly totalRecords = computed(() => this.serviceRecords().length);
  protected readonly totalServiceCostByCurrency = computed(() => {
    const totals = new Map<string, number>();

    this.serviceRecords().forEach(record => {
      if (record.cost === null) {
        return;
      }

      const currency = this.getRecordCurrency(record);
      totals.set(currency, (totals.get(currency) ?? 0) + record.cost);
    });

    return Array.from(totals.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([currency, total]) => this.formatMoney(total, currency))
      .join(' | ');
  });

  protected readonly timelineEntries = computed(() =>
    [...this.serviceRecords()]
      .filter(
        record =>
          this.matchesCategoryFilter(record) &&
          this.matchesPriceFilter(record) &&
          this.matchesTitleFilter(record)
      )
      .sort((a, b) => this.compareRecords(a, b))
  );
  protected readonly mileageWarningRecordIds = computed(() =>
    this.findMileageWarningRecordIds(this.serviceRecords(), record => record.serviceDate)
  );

  protected readonly sliderTrackStyle = computed(() => {
    const max = this.maxAvailablePrice();
    const range = max || 1;

    const startPercent = (this.minPriceLimit() / range) * 100;
    const endPercent = (this.maxPriceLimit() / range) * 100;

    return {
      '--track-start': `${Math.max(0, Math.min(100, startPercent))}%`,
      '--track-end': `${Math.max(0, Math.min(100, endPercent))}%`,
    };
  });

  constructor() {
    this.loadCategories();
  }

  protected openCreateModal() {
    this.closeFilterModal();
    this.selectedRecord.set(null);
    this.actionError.set(null);
    this.pendingAttachments.set([]);
    this.form.reset({
      serviceDate: '',
      title: '',
      mileage: null,
      category: '',
      description: '',
      cost: null,
      currency: this.currencyService.selectedCurrency(),
    });
    this.modalMode.set('create');
  }

  protected openRecordDetails(record: ServiceRecord) {
    this.closeFilterModal();
    this.selectedRecord.set(record);
    this.actionError.set(null);
    this.modalMode.set('view');
  }

  protected openFilterModal() {
    this.ensureFilterDefaults();
    this.isFilterModalOpen.set(true);
  }

  protected closeFilterModal() {
    this.isFilterModalOpen.set(false);
  }

  protected toggleAllCategories(checked: boolean) {
    if (checked) {
      this.selectedCategories.set([...this.availableFilterCategories()]);
      return;
    }

    this.selectedCategories.set([]);
  }

  protected isCategorySelected(category: string): boolean {
    return this.selectedCategories().includes(category);
  }

  protected toggleCategory(category: string, checked: boolean) {
    if (checked) {
      this.selectedCategories.set([...this.selectedCategories(), category]);
      return;
    }

    this.selectedCategories.set(
      this.selectedCategories().filter(selectedCategory => selectedCategory !== category)
    );
  }

  protected onMinPriceLimitChange(rawValue: string) {
    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) {
      return;
    }

    const bounded = Math.max(0, parsed);
    this.minPriceLimit.set(Math.min(bounded, this.maxPriceLimit()));
  }

  protected onMaxPriceLimitChange(rawValue: string) {
    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) {
      return;
    }

    const bounded = Math.min(this.maxAvailablePrice(), parsed);
    this.maxPriceLimit.set(Math.max(bounded, this.minPriceLimit()));
  }

  protected onCurrencyFilterChange(rawValue: string) {
    const available = this.availableFilterCurrencies();
    const selected =
      rawValue === this.allCurrenciesOption || available.includes(rawValue)
        ? rawValue
        : this.allCurrenciesOption;

    this.selectedCurrencyFilter.set(selected);
    this.minPriceLimit.set(0);
    this.maxPriceLimit.set(this.maxAvailablePrice());
  }

  protected resetFilters() {
    this.selectedCategories.set([...this.availableFilterCategories()]);
    this.selectedCurrencyFilter.set(this.allCurrenciesOption);
    this.minPriceLimit.set(0);
    this.maxPriceLimit.set(this.maxAvailablePrice());
  }

  protected onSortChange(rawValue: string) {
    if (
      rawValue !== 'newest' &&
      rawValue !== 'oldest' &&
      rawValue !== 'price-low-high' &&
      rawValue !== 'price-high-low'
    ) {
      return;
    }

    this.selectedSort.set(rawValue);
  }

  protected onTitleSearchChange(rawValue: string) {
    this.titleSearch.set(rawValue.trimStart());
  }

  protected categoryLabel(category: string): string {
    switch (category.trim().toLowerCase()) {
      case 'inspection':
        return 'vehicle.maintenanceTab.categories.inspection';
      case 'oil change':
        return 'vehicle.maintenanceTab.categories.oilChange';
      case 'repair':
        return 'vehicle.maintenanceTab.categories.repair';
      case 'part replacement':
        return 'vehicle.maintenanceTab.categories.partReplacement';
      case 'fluid refill':
        return 'vehicle.maintenanceTab.categories.fluidRefill';
      case 'tires & wheels':
        return 'vehicle.maintenanceTab.categories.tiresAndWheels';
      case 'cosmetic':
        return 'vehicle.maintenanceTab.categories.cosmetic';
      default:
        return category;
    }
  }

  protected startEditSelectedRecord() {
    const record = this.selectedRecord();
    if (!record) {
      return;
    }

    this.actionError.set(null);
    this.pendingAttachments.set([]);
    this.form.reset({
      serviceDate: record.serviceDate,
      title: record.title ?? '',
      mileage: record.mileage,
      category: record.category,
      description: record.description,
      cost: record.cost,
      currency: record.currency || this.currencyService.selectedCurrency(),
    });
    this.modalMode.set('edit');
  }

  protected saveRecord() {
    if (this.form.invalid || !this.currentVehicleId) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    if (!payload) {
      this.actionError.set('vehicle.maintenanceTab.errors.invalidData');
      return;
    }

    const selected = this.selectedRecord();
    const isEdit = this.modalMode() === 'edit' && !!selected;

    this.isSaving.set(true);
    this.actionError.set(null);

    const request$ = isEdit
      ? this.http.put<ServiceRecord>(
          `${this.vehicleApi}/${this.currentVehicleId}/maintenance/${selected.id}`,
          payload
        )
      : this.http.post<ServiceRecord>(
          `${this.vehicleApi}/${this.currentVehicleId}/maintenance`,
          payload
        );

    request$
      .pipe(
        switchMap(saved =>
          this.uploadAttachmentsIfNeeded(saved.id).pipe(map(() => saved))
        ),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: () => {
          this.closeModal();
          this.loadServiceRecords();
        },
        error: () => {
          if (!this.actionError()) {
            this.actionError.set('vehicle.maintenanceTab.errors.saveFailed');
          }
        },
      });
  }

  protected deleteSelectedRecord() {
    const selected = this.selectedRecord();
    if (!selected || !this.currentVehicleId) {
      return;
    }

    this.isDeleting.set(true);
    this.actionError.set(null);

    this.http
      .delete<void>(`${this.vehicleApi}/${this.currentVehicleId}/maintenance/${selected.id}`)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          this.closeModal();
          this.loadServiceRecords();
        },
        error: () => {
          this.actionError.set('vehicle.maintenanceTab.errors.deleteFailed');
        },
      });
  }

  protected closeModal() {
    this.modalMode.set('closed');
    this.selectedRecord.set(null);
    this.actionError.set(null);
    this.pendingAttachments.set([]);
  }

  protected modalTitle(): string {
    return this.modalMode() === 'edit'
      ? 'vehicle.maintenanceTab.modalTitle.edit'
      : 'vehicle.maintenanceTab.modalTitle.add';
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

  private loadCategories() {
    this.http.get<string[]>(this.metadataApi).subscribe({
      next: categories => {
        this.categories.set(categories);
        this.ensureFilterDefaults();
      },
      error: () => {
        this.categories.set([
          'Inspection',
          'Oil change',
          'Repair',
          'Part Replacement',
          'Fluid refill',
          'Tires & Wheels',
          'Cosmetic',
        ]);
        this.ensureFilterDefaults();
      },
    });
  }

  private loadServiceRecords() {
    if (!this.currentVehicleId) {
      this.serviceRecords.set([]);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.http
      .get<ServiceRecord[]>(`${this.vehicleApi}/${this.currentVehicleId}/maintenance`)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: data => {
          this.serviceRecords.set(data);
          this.ensureFilterDefaults();
        },
        error: () => {
          this.serviceRecords.set([]);
          this.error.set('vehicle.maintenanceTab.errors.loadFailed');
        },
      });
  }

  private buildPayload() {
    const serviceDate = (this.form.controls.serviceDate.value ?? '').trim();
    const title = (this.form.controls.title.value ?? '').trim();
    const category = (this.form.controls.category.value ?? '').trim();
    const description = (this.form.controls.description.value ?? '').trim();
    const mileageValue = this.form.controls.mileage.value;
    const costValue = this.form.controls.cost.value;
    const currencyValue = (this.form.controls.currency.value ?? '').trim();

    if (!serviceDate || !title || !category || title.length > 50 || !currencyValue) {
      return null;
    }

    const mileage =
      mileageValue === null || mileageValue === undefined || mileageValue === ('' as any)
        ? null
        : Math.trunc(Number(mileageValue));

    const cost =
      costValue === null || costValue === undefined || costValue === ('' as any)
        ? null
        : Number(costValue);

    if ((mileage !== null && Number.isNaN(mileage)) || (cost !== null && Number.isNaN(cost))) {
      return null;
    }

    return {
      serviceDate,
      title,
      mileage,
      category,
      description,
      cost,
      currency: currencyValue,
    };
  }

  protected formatDate(serviceDate: string): string {
    const [year, month, day] = serviceDate.split('-');
    if (!year || !month || !day) {
      return serviceDate;
    }
    return `${day}.${month}.${year}`;
  }

  protected iconForCategory(category: string): string {
    const normalizedCategory = category.trim().toLowerCase();
    const iconMap: Record<string, string> = {
      inspection: 'search',
      'oil change': 'droplet',
      repair: 'wrench',
      'part replacement': 'cog',
      'fluid refill': 'droplets',
      'tires & wheels': 'disc',
      cosmetic: 'sparkles',
    };

    return iconMap[normalizedCategory] ?? 'tool-case';
  }

  protected hasMileageWarning(record: ServiceRecord): boolean {
    return this.mileageWarningRecordIds().has(record.id);
  }

  protected onAttachmentSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const selected = Array.from(input.files);
    const valid = selected.filter(file => this.attachmentService.isAllowedAttachment(file));
    if (valid.length !== selected.length) {
      this.actionError.set('vehicle.maintenanceTab.errors.invalidAttachmentType');
    } else if (valid.length) {
      this.actionError.set(null);
    }

    const existing = this.pendingAttachments();
    const withinLimit = valid.filter(file => file.size <= this.attachmentService.maxAttachmentBytes);
    if (withinLimit.length !== valid.length) {
      this.actionError.set('vehicle.maintenanceTab.errors.attachmentTooLarge');
    }

    this.pendingAttachments.set([...existing, ...withinLimit]);
    input.value = '';
  }

  protected removePendingAttachment(index: number) {
    const files = [...this.pendingAttachments()];
    files.splice(index, 1);
    this.pendingAttachments.set(files);
  }

  private uploadAttachmentsIfNeeded(maintenanceId: number) {
    const files = this.pendingAttachments();
    if (!files.length || !this.currentVehicleId) {
      return of(undefined);
    }

    return this.attachmentService
      .uploadAttachments(this.currentVehicleId, maintenanceId, files)
      .pipe(
      catchError(err => {
        if (err instanceof Error && err.message === 'Attachment too large') {
          this.actionError.set('vehicle.maintenanceTab.errors.attachmentTooLarge');
          return throwError(() => err);
        }

        this.actionError.set('vehicle.maintenanceTab.errors.uploadFailed');
        return throwError(() => err);
      })
    );
  }

  protected openAttachment(attachment: MaintenanceAttachment) {
    if (!this.currentVehicleId || !this.selectedRecord()) {
      return;
    }

    this.actionError.set(null);

    this.http
      .get<DownloadUrlResponse>(
        `${this.vehicleApi}/${this.currentVehicleId}/maintenance/${this.selectedRecord()!.id}/attachments/${attachment.id}/download-url`
      )
      .subscribe({
        next: response => {
          if (response.downloadUrl) {
            window.open(response.downloadUrl, '_blank', 'noopener');
          }
        },
        error: () => {
          this.actionError.set('vehicle.maintenanceTab.errors.downloadFailed');
        },
      });
  }

  private toTimestamp(serviceDate: string): number {
    const timestamp = new Date(`${serviceDate}T00:00:00`).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private ensureFilterDefaults() {
    const availableCategories = this.availableFilterCategories();

    const maxPrice = this.maxAvailablePrice();

    if (!this.filtersInitialized) {
      this.selectedCategories.set([...availableCategories]);
      this.minPriceLimit.set(0);
      this.maxPriceLimit.set(maxPrice);
      this.filtersInitialized = true;
      return;
    }

    const selected = this.selectedCategories().filter(category =>
      availableCategories.includes(category)
    );

    this.selectedCategories.set(selected);

    
    if (this.minPriceLimit() === 0 && this.maxPriceLimit() === 0 && maxPrice > 0) {
      this.maxPriceLimit.set(maxPrice);
    }

    if (this.maxPriceLimit() > maxPrice) {
      this.maxPriceLimit.set(maxPrice);
    }

    if (this.minPriceLimit() < 0) {
      this.minPriceLimit.set(0);
    }

    if (this.minPriceLimit() > this.maxPriceLimit()) {
      this.minPriceLimit.set(this.maxPriceLimit());
    }
  }

  private matchesCategoryFilter(record: ServiceRecord): boolean {
    const selectedCategories = this.selectedCategories();

    if (!selectedCategories.length) {
      return false;
    }

    return selectedCategories.includes(record.category);
  }

  private matchesPriceFilter(record: ServiceRecord): boolean {
    const selectedCurrency = this.selectedCurrencyFilter();
    const recordCurrency = this.getRecordCurrency(record);

    if (selectedCurrency !== this.allCurrenciesOption && recordCurrency !== selectedCurrency) {
      return false;
    }

    if (record.cost === null) {
      return selectedCurrency === this.allCurrenciesOption;
    }

    return record.cost >= this.minPriceLimit() && record.cost <= this.maxPriceLimit();
  }

  private getRecordsForSelectedCurrencyFilter(): ServiceRecord[] {
    const selectedCurrency = this.selectedCurrencyFilter();
    if (selectedCurrency === this.allCurrenciesOption) {
      return this.serviceRecords();
    }

    return this.serviceRecords().filter(record => this.getRecordCurrency(record) === selectedCurrency);
  }

  private getRecordCurrency(record: ServiceRecord): string {
    const fallbackCurrency = this.currencyService.selectedCurrency();
    return (record.currency || fallbackCurrency).trim().toUpperCase();
  }

  private matchesTitleFilter(record: ServiceRecord): boolean {
    const query = this.titleSearch().trim().toLowerCase();
    if (!query) {
      return true;
    }

    const title = (record.title ?? '').toLowerCase();
    return title.includes(query);
  }

  private compareRecords(a: ServiceRecord, b: ServiceRecord): number {
    const sort = this.selectedSort();

    if (sort === 'oldest') {
      return this.toTimestamp(a.serviceDate) - this.toTimestamp(b.serviceDate);
    }

    if (sort === 'price-low-high') {
      return this.compareByPrice(a, b, 'asc');
    }

    if (sort === 'price-high-low') {
      return this.compareByPrice(a, b, 'desc');
    }

    return this.toTimestamp(b.serviceDate) - this.toTimestamp(a.serviceDate);
  }

  private compareByPrice(a: ServiceRecord, b: ServiceRecord, direction: 'asc' | 'desc'): number {
    const left = a.cost ?? Number.POSITIVE_INFINITY;
    const right = b.cost ?? Number.POSITIVE_INFINITY;

    if (left !== right) {
      return direction === 'asc' ? left - right : right - left;
    }

    return this.toTimestamp(b.serviceDate) - this.toTimestamp(a.serviceDate);
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
}
