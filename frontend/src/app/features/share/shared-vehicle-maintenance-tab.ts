import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, catchError, finalize, of, switchMap, tap } from 'rxjs';
import type { Page } from '../../shared/models';
import { emptyPage } from '../../shared/models';
import { NotificationService } from '../../shared/services/notification.service';
import { Modal } from '../../shared/ui/modal/modal';
import { formatCurrencyTotals } from '../../shared/utils/currency-totals.utils';
import { CurrencyService } from '../../shared/services/currency.service';
import {
  MaintenanceList,
  type MaintenanceQueryChange,
} from '../vehicle/ui/maintenance-list/maintenance-list';
import { MaintenanceRecordDetails } from '../vehicle/ui/maintenance-record-details/maintenance-record-details';
import type {
  MaintenanceAttachment,
  MaintenanceQuery,
  MaintenanceRecord,
  MaintenanceSummary,
} from '../vehicle/models';
import { DEFAULT_MAINTENANCE_QUERY } from '../vehicle/models';
import { PublicShareApi } from './public-share-api';

/**
 * Read-only counterpart of `VehicleMaintenanceTab` for the public share page. There is no public
 * categories-metadata endpoint, so the category filter is never offered here (see
 * `MaintenanceList`'s handling of an empty `availableCategories`).
 */
@Component({
  selector: 'app-shared-vehicle-maintenance-tab',
  imports: [CommonModule, TranslateModule, Modal, MaintenanceList, MaintenanceRecordDetails],
  templateUrl: './shared-vehicle-maintenance-tab.html',
  styleUrl: './shared-vehicle-maintenance-tab.css',
})
export class SharedVehicleMaintenanceTab {
  private readonly publicShareApi = inject(PublicShareApi);
  private readonly currencyService = inject(CurrencyService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly load$ = new Subject<{ token: string; query: MaintenanceQuery }>();

  private currentToken = '';

  @Input({ required: true })
  set token(value: string) {
    this.currentToken = value ?? '';
    this.query.set(DEFAULT_MAINTENANCE_QUERY);
    this.fetch();
  }

  @Input({ required: true })
  set summary(value: MaintenanceSummary | null) {
    this.summaryValue.set(value ?? null);
  }

  protected readonly summaryValue = signal<MaintenanceSummary | null>(null);
  protected readonly query = signal<MaintenanceQuery>(DEFAULT_MAINTENANCE_QUERY);
  protected readonly serviceRecords = signal<MaintenanceRecord[]>([]);
  protected readonly page = signal(0);
  protected readonly size = signal(DEFAULT_MAINTENANCE_QUERY.size);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly isModalOpen = signal(false);
  protected readonly selectedRecord = signal<MaintenanceRecord | null>(null);

  protected readonly totalCostByCurrency = computed(() =>
    formatCurrencyTotals(this.summaryValue()?.totalCostByCurrency, (value, currency) =>
      this.currencyService.formatCurrency(value, currency)
    )
  );
  protected readonly mileageWarningRecordIds = computed(
    () => new Set(this.summaryValue()?.mileageWarningRecordIds ?? [])
  );
  protected readonly maxAvailablePrice = computed(() => this.summaryValue()?.maxCost ?? 0);

  constructor() {
    this.load$
      .pipe(
        tap(() => {
          this.isLoading.set(true);
          this.error.set(null);
        }),
        switchMap(({ token, query }) =>
          this.publicShareApi.getMaintenancePage(token, query).pipe(
            catchError(() => {
              this.error.set('sharedVehicle.maintenanceTab.errors.loadFailed');
              return of<Page<MaintenanceRecord>>(emptyPage(query.page, query.size));
            }),
            finalize(() => this.isLoading.set(false))
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((page) => this.applyPage(page));
  }

  protected onQueryChange(change: MaintenanceQueryChange) {
    this.query.update((current) => ({ ...current, ...change, page: 0 }));
    this.fetch();
  }

  protected onPageChange(page: number) {
    this.query.update((current) => ({ ...current, page }));
    this.fetch();
  }

  protected onSizeChange(size: number) {
    this.query.update((current) => ({ ...current, size, page: 0 }));
    this.fetch();
  }

  protected openRecordDetails(record: MaintenanceRecord) {
    this.selectedRecord.set(record);
    this.isModalOpen.set(true);

    this.publicShareApi.getMaintenanceById(this.currentToken, record.id).subscribe({
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

  protected closeModal() {
    this.isModalOpen.set(false);
    this.selectedRecord.set(null);
  }

  protected hasMileageWarning(record: MaintenanceRecord): boolean {
    return this.mileageWarningRecordIds().has(record.id);
  }

  protected openAttachment(attachment: MaintenanceAttachment) {
    const record = this.selectedRecord();
    if (!record) {
      return;
    }

    this.publicShareApi
      .getMaintenanceAttachmentDownloadUrl(this.currentToken, record.id, attachment.id)
      .subscribe({
        next: (response) => {
          if (response.downloadUrl) {
            window.open(response.downloadUrl, '_blank', 'noopener');
          }
        },
        error: () => {
          this.notifications.notifyError('sharedVehicle.maintenanceTab.errors.downloadFailed');
        },
      });
  }

  private fetch(): void {
    if (!this.currentToken) {
      return;
    }

    this.load$.next({ token: this.currentToken, query: this.query() });
  }

  private applyPage(page: Page<MaintenanceRecord>): void {
    this.serviceRecords.set(page.items);
    this.page.set(page.page);
    this.size.set(page.size);
    this.totalElements.set(page.totalElements);
    this.totalPages.set(page.totalPages);
  }
}
