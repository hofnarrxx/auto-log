import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, map, of, switchMap, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { CategoryLabelPipe } from '../../../../shared/pipes';
import { CurrencyService } from '../../../../shared/services/currency.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Modal } from '../../../../shared/ui/modal/modal';
import { formatCurrencyTotals } from '../../../../shared/utils/currency-totals.utils';
import { parseIntegerField, parseNumericField } from '../../../../shared/utils/form-value.utils';
import {
  MAX_COST,
  MAX_MILEAGE,
  integerValidator,
  maxDecimalsValidator,
  notInFutureValidator,
} from '../../../../shared/utils/field.validators';
import { applyServerFieldErrors } from '../../../../shared/utils/server-field-errors.utils';
import { AttachmentPicker } from '../../ui/attachment-picker/attachment-picker';
import {
  MaintenanceList,
  type MaintenanceQueryChange,
} from '../../ui/maintenance-list/maintenance-list';
import { MaintenanceRecordDetails } from '../../ui/maintenance-record-details/maintenance-record-details';
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
    Modal,
    MaintenanceList,
    MaintenanceRecordDetails,
    AttachmentPicker,
    CategoryLabelPipe,
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
    serviceDate: new FormControl('', [Validators.required, notInFutureValidator]),
    title: new FormControl('', [Validators.required, Validators.maxLength(50)]),
    mileage: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(MAX_MILEAGE),
      integerValidator,
    ]),
    category: new FormControl('', Validators.required),
    description: new FormControl('', [Validators.maxLength(200)]),
    cost: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(MAX_COST),
      maxDecimalsValidator(2),
    ]),
    currency: new FormControl<string>('', Validators.required),
  });

  /**
   * First matching error key per field, in priority order, used by `fieldError()` to keep the
   * template down to a single error line per field even though several validators can now apply
   * to the same control.
   */
  private static readonly ERROR_KEYS: Record<string, Record<string, string>> = {
    serviceDate: {
      futureDate: 'serviceDateFuture',
      server: 'serverRejected',
      required: 'serviceDateRequired',
    },
    title: { server: 'serverRejected', maxlength: 'titleRequired', required: 'titleRequired' },
    mileage: {
      notInteger: 'mileageInteger',
      max: 'mileageMax',
      server: 'serverRejected',
      required: 'mileageRequired',
      min: 'mileageRequired',
    },
    category: { server: 'serverRejected', required: 'categoryRequired' },
    description: { server: 'serverRejected', maxlength: 'descriptionMaxLength' },
    cost: {
      maxDecimals: 'costDecimals',
      max: 'costMax',
      server: 'serverRejected',
      required: 'costRequired',
      min: 'costRequired',
    },
    currency: { server: 'serverRejected', required: 'currencyRequired' },
  };

  @Input({ required: true })
  set vehicleId(value: string) {
    this.currentVehicleId = value;
    this.maintenanceStore.load(value);
    this.maintenanceStore.loadSummary(value);
  }

  private currentVehicleId: string | null = null;

  protected readonly categories = this.maintenanceStore.categories;
  protected readonly isLoading = this.maintenanceStore.isLoading;
  protected readonly hasLoadedOnce = this.maintenanceStore.hasLoadedOnce;
  protected readonly error = this.maintenanceStore.error;
  protected readonly isSaving = this.maintenanceStore.isSaving;
  protected readonly isDeleting = this.maintenanceStore.isDeleting;
  protected readonly serviceRecords = this.maintenanceStore.records;
  protected readonly query = this.maintenanceStore.query;
  protected readonly page = this.maintenanceStore.page;
  protected readonly size = this.maintenanceStore.size;
  protected readonly totalPages = this.maintenanceStore.totalPages;
  protected readonly totalElements = this.maintenanceStore.totalElements;
  protected readonly summary = this.maintenanceStore.summary;

  protected readonly modalMode = signal<ModalMode>('closed');
  protected readonly selectedRecord = signal<MaintenanceRecord | null>(null);
  protected readonly pendingAttachments = signal<File[]>([]);

  protected readonly isModalOpen = computed(() => this.modalMode() !== 'closed');
  protected readonly isFormMode = computed(() => {
    const mode = this.modalMode();
    return mode === 'create' || mode === 'edit';
  });
  protected readonly totalServiceCostByCurrency = computed(() =>
    formatCurrencyTotals(this.summary()?.totalCostByCurrency, (value, currency) =>
      this.currencyService.formatCurrency(value, currency)
    )
  );
  protected readonly mileageWarningRecordIds = computed(
    () => new Set(this.summary()?.mileageWarningRecordIds ?? [])
  );
  protected readonly maxAvailablePrice = computed(() => this.summary()?.maxCost ?? 0);

  constructor() {
    this.maintenanceStore.loadCategories();
  }

  protected onQueryChange(change: MaintenanceQueryChange) {
    this.maintenanceStore.setQuery(change);
  }

  protected onPageChange(page: number) {
    this.maintenanceStore.setPage(page);
  }

  protected onSizeChange(size: number) {
    this.maintenanceStore.setSize(size);
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

    if (!this.currentVehicleId) {
      return;
    }

    this.maintenanceStore.getById(this.currentVehicleId, record.id).subscribe({
      next: (fullRecord) => {
        if (this.selectedRecord()?.id === record.id) {
          this.selectedRecord.set(fullRecord);
        }
      },
      error: () => {
        // Keep showing the list item (without attachments) if the detail fetch fails.
      },
    });
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
        },
        error: (err) => {
          if (!applyServerFieldErrors(this.form, err)) {
            this.notifications.notifyError(
              this.resolveErrorKey(err, 'vehicle.maintenanceTab.errors.saveFailed')
            );
          }
        },
      });
  }

  /**
   * First translation key suffix for `name`'s current error, or `null` when the control has no
   * error worth showing yet. Keeps the template to a single error line per field even though
   * several validators can apply to the same control.
   */
  protected fieldError(name: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[name];
    if (!control.invalid || !control.touched) {
      return null;
    }

    const keys = VehicleMaintenanceTab.ERROR_KEYS[name];
    const errorCode = Object.keys(keys).find((code) => control.hasError(code));
    return errorCode ? keys[errorCode] : null;
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

  protected onAttachmentsSelected(files: FileList) {
    const selected = Array.from(files);
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
  }

  protected removePendingAttachment(index: number) {
    const files = [...this.pendingAttachments()];
    files.splice(index, 1);
    this.pendingAttachments.set(files);
  }

  private uploadAttachmentsIfNeeded(maintenanceId: string) {
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

  protected deleteAttachment(attachment: MaintenanceAttachment) {
    const record = this.selectedRecord();
    if (!this.currentVehicleId || !record) {
      return;
    }

    this.maintenanceStore
      .deleteAttachment(this.currentVehicleId, record.id, attachment.id)
      .subscribe({
        next: () => {
          const current = this.selectedRecord();
          if (current?.id !== record.id) {
            return;
          }
          this.selectedRecord.set({
            ...current,
            attachments: (current.attachments ?? []).filter((a) => a.id !== attachment.id),
          });
        },
        error: () => {
          this.notifications.notifyError('vehicle.maintenanceTab.errors.attachmentDeleteFailed');
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
