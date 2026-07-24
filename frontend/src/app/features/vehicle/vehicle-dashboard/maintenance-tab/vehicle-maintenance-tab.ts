import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, map, of, switchMap, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule,
} from 'lucide-angular';
import { CategoryLabelPipe, DateFormatPipe, MoneyPipe } from '../../../../shared/pipes';
import { CurrencyService } from '../../../../shared/services/currency.service';
import { MaintenanceListComponent } from '../../../../shared/ui/maintenance-list/maintenance-list.component';
import { AttachmentService } from '../../services/attachment.service';
import {
  MaintenanceApiService,
  MaintenanceAttachment,
  MaintenanceAttachmentDownloadUrlResponse,
  MaintenanceRecord as ServiceRecord,
  MaintenanceRecordPayload,
} from '../../services/maintenance-api.service';
import { getMaintenanceWarningRecordIds } from '../../../../shared/utils/maintenance-list.utils';

type ModalMode = 'closed' | 'create' | 'view' | 'edit';
type SortOption = 'newest' | 'oldest' | 'price-low-high' | 'price-high-low';

@Component({
  selector: 'app-vehicle-maintenance-tab',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    TranslateModule,
    LucideAngularModule,
    MaintenanceListComponent,
    CategoryLabelPipe,
    DateFormatPipe,
    MoneyPipe,
  ],
  templateUrl: './vehicle-maintenance-tab.html',
  styleUrl: './vehicle-maintenance-tab.css',
})
export class VehicleMaintenanceTab {
  private readonly currencyService = inject(CurrencyService);
  private readonly attachmentService = inject(AttachmentService);
  private readonly maintenanceApiService = inject(MaintenanceApiService);

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
  protected readonly modalMode = signal<ModalMode>('closed');
  protected readonly selectedRecord = signal<ServiceRecord | null>(null);
  protected readonly pendingAttachments = signal<File[]>([]);

  protected readonly serviceRecords = signal<ServiceRecord[]>([]);

  protected readonly isModalOpen = computed(() => this.modalMode() !== 'closed');
  protected readonly isFormMode = computed(() => {
    const mode = this.modalMode();
    return mode === 'create' || mode === 'edit';
  });
  protected readonly mileageWarningRecordIds = computed(() =>
    getMaintenanceWarningRecordIds(this.serviceRecords(), record => record.serviceDate)
  );

  constructor() {
    this.loadCategories();
  }

  protected openCreateModal() {
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
    this.selectedRecord.set(record);
    this.actionError.set(null);
    this.modalMode.set('view');
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
      ? this.maintenanceApiService.updateMaintenance(
          this.currentVehicleId,
          selected.id,
          payload as MaintenanceRecordPayload
        )
      : this.maintenanceApiService.createMaintenance(
          this.currentVehicleId,
          payload as MaintenanceRecordPayload
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

    this.maintenanceApiService
      .deleteMaintenance(this.currentVehicleId, selected.id)
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

  private loadCategories() {
    this.maintenanceApiService.getCategories().subscribe({
      next: categories => {
        this.categories.set(categories);
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

    this.maintenanceApiService
      .getMaintenance(this.currentVehicleId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: data => {
          this.serviceRecords.set(data);
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

    this.maintenanceApiService
      .getAttachmentDownloadUrl(this.currentVehicleId, this.selectedRecord()!.id, attachment.id)
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

}
