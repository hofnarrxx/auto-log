import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, map, of, switchMap, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { CategoryLabelPipe, DateFormatPipe, MoneyPipe } from '../../../../shared/pipes';
import { CurrencyService } from '../../../../shared/services/currency.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { MaintenanceListComponent } from '../../../../shared/ui/maintenance-list/maintenance-list.component';
import { parseIntegerField, parseNumericField } from '../../../../shared/utils/form-value.utils';
import { findMileageWarningRecordIds } from '../../../../shared/utils/mileage.utils';
import { MaintenanceStore } from '../../maintenance-store';
import type {
  MaintenanceAttachment,
  MaintenanceRecord,
  MaintenanceRecordPayload,
} from '../../models';
import { AttachmentService } from '../../services/attachment.service';

type ModalMode = 'closed' | 'create' | 'view' | 'edit';

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
  private readonly maintenanceStore = inject(MaintenanceStore);
  private readonly notifications = inject(NotificationService);

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
    this.maintenanceStore.load(value);
  }

  private currentVehicleId: number | null = null;

  protected readonly categories = this.maintenanceStore.categories;
  protected readonly isLoading = this.maintenanceStore.isLoading;
  protected readonly error = this.maintenanceStore.error;
  protected readonly isSaving = this.maintenanceStore.isSaving;
  protected readonly isDeleting = this.maintenanceStore.isDeleting;
  protected readonly serviceRecords = this.maintenanceStore.records;

  protected readonly modalMode = signal<ModalMode>('closed');
  protected readonly selectedRecord = signal<MaintenanceRecord | null>(null);
  protected readonly pendingAttachments = signal<File[]>([]);

  protected readonly isModalOpen = computed(() => this.modalMode() !== 'closed');
  protected readonly isFormMode = computed(() => {
    const mode = this.modalMode();
    return mode === 'create' || mode === 'edit';
  });
  protected readonly mileageWarningRecordIds = computed(() =>
    findMileageWarningRecordIds(this.serviceRecords(), (record) => record.serviceDate)
  );

  constructor() {
    this.maintenanceStore.loadCategories();
  }

  protected openCreateModal() {
    this.selectedRecord.set(null);
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

  protected openRecordDetails(record: MaintenanceRecord) {
    this.selectedRecord.set(record);
    this.modalMode.set('view');
  }

  protected startEditSelectedRecord() {
    const record = this.selectedRecord();
    if (!record) {
      return;
    }

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
      this.notifications.notifyError('vehicle.maintenanceTab.errors.invalidData');
      return;
    }

    const selected = this.selectedRecord();
    const isEdit = this.modalMode() === 'edit' && !!selected;

    this.maintenanceStore
      .save(
        this.currentVehicleId,
        payload as MaintenanceRecordPayload,
        isEdit ? selected.id : undefined
      )
      .pipe(switchMap((saved) => this.uploadAttachmentsIfNeeded(saved.id).pipe(map(() => saved))))
      .subscribe({
        next: () => {
          this.closeModal();
          this.maintenanceStore.load(this.currentVehicleId!);
        },
        error: (err) => {
          this.notifications.notifyError(
            this.resolveErrorKey(err, 'vehicle.maintenanceTab.errors.saveFailed')
          );
        },
      });
  }

  protected deleteSelectedRecord() {
    const selected = this.selectedRecord();
    if (!selected || !this.currentVehicleId) {
      return;
    }

    this.maintenanceStore.delete(this.currentVehicleId, selected.id).subscribe({
      next: () => {
        this.closeModal();
      },
      error: () => {
        this.notifications.notifyError('vehicle.maintenanceTab.errors.deleteFailed');
      },
    });
  }

  protected closeModal() {
    this.modalMode.set('closed');
    this.selectedRecord.set(null);
    this.pendingAttachments.set([]);
  }

  protected modalTitle(): string {
    return this.modalMode() === 'edit'
      ? 'vehicle.maintenanceTab.modalTitle.edit'
      : 'vehicle.maintenanceTab.modalTitle.add';
  }

  private buildPayload(): MaintenanceRecordPayload | null {
    const serviceDate = (this.form.controls.serviceDate.value ?? '').trim();
    const title = (this.form.controls.title.value ?? '').trim();
    const category = (this.form.controls.category.value ?? '').trim();
    const description = (this.form.controls.description.value ?? '').trim();
    const currencyValue = (this.form.controls.currency.value ?? '').trim();

    if (!serviceDate || !title || !category || title.length > 50 || !currencyValue) {
      return null;
    }

    const mileage = parseIntegerField(this.form.controls.mileage.value);
    const cost = parseNumericField(this.form.controls.cost.value);

    if (mileage.kind === 'invalid' || cost.kind === 'invalid') {
      return null;
    }

    return {
      serviceDate,
      title,
      mileage: mileage.kind === 'number' ? mileage.value : null,
      category,
      description,
      cost: cost.kind === 'number' ? cost.value : null,
      currency: currencyValue,
    };
  }

  protected hasMileageWarning(record: MaintenanceRecord): boolean {
    return this.mileageWarningRecordIds().has(record.id);
  }

  protected onAttachmentSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const selected = Array.from(input.files);
    const valid = selected.filter((file) => this.attachmentService.isAllowedAttachment(file));
    if (valid.length !== selected.length) {
      this.notifications.notifyError('vehicle.maintenanceTab.errors.invalidAttachmentType');
    }

    const existing = this.pendingAttachments();
    const withinLimit = valid.filter(
      (file) => file.size <= this.attachmentService.maxAttachmentBytes
    );
    if (withinLimit.length !== valid.length) {
      this.notifications.notifyError('vehicle.maintenanceTab.errors.attachmentTooLarge');
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
        catchError((err) => {
          if (err instanceof Error && err.message === 'Attachment too large') {
            return throwError(() => ({
              messageKey: 'vehicle.maintenanceTab.errors.attachmentTooLarge',
            }));
          }

          return throwError(() => ({ messageKey: 'vehicle.maintenanceTab.errors.uploadFailed' }));
        })
      );
  }

  protected openAttachment(attachment: MaintenanceAttachment) {
    if (!this.currentVehicleId || !this.selectedRecord()) {
      return;
    }

    this.maintenanceStore
      .getAttachmentDownloadUrl(this.currentVehicleId, this.selectedRecord()!.id, attachment.id)
      .subscribe({
        next: (response) => {
          if (response.downloadUrl) {
            window.open(response.downloadUrl, '_blank', 'noopener');
          }
        },
        error: () => {
          this.notifications.notifyError('vehicle.maintenanceTab.errors.downloadFailed');
        },
      });
  }

  private resolveErrorKey(error: unknown, fallbackKey: string): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'messageKey' in error &&
      typeof (error as { messageKey: unknown }).messageKey === 'string'
    ) {
      return (error as { messageKey: string }).messageKey;
    }

    return fallbackKey;
  }
}
