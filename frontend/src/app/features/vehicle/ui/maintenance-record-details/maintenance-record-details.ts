import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CategoryLabelPipe, DateFormatPipe, MoneyPipe } from '../../../../shared/pipes';
import type { MaintenanceAttachment, MaintenanceRecord } from '../../models';

/**
 * Read-only maintenance record view, reused by the authenticated maintenance tab's details modal
 * and the public share maintenance tab. Attachment download is opt-in via `attachmentsOpenable`
 * since public share links only expose file names.
 */
@Component({
  selector: 'app-maintenance-record-details',
  imports: [TranslateModule, CategoryLabelPipe, DateFormatPipe, MoneyPipe],
  templateUrl: './maintenance-record-details.html',
  styleUrl: './maintenance-record-details.css',
})
export class MaintenanceRecordDetails {
  @Input({ required: true }) record!: MaintenanceRecord;
  @Input() hasMileageWarning = false;
  @Input() attachmentsOpenable = false;
  @Output() attachmentOpened = new EventEmitter<MaintenanceAttachment>();

  protected openAttachment(attachment: MaintenanceAttachment) {
    this.attachmentOpened.emit(attachment);
  }
}
