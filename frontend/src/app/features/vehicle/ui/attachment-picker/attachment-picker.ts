import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Dumb file-picker UI for pending maintenance attachments. Validation (allowed types, size
 * limits) and the actual upload stay with the orchestrating tab/store.
 */
@Component({
  selector: 'app-attachment-picker',
  imports: [TranslateModule],
  templateUrl: './attachment-picker.html',
  styleUrl: './attachment-picker.css',
})
export class AttachmentPicker {
  @Input() pendingFiles: File[] = [];
  @Output() filesSelected = new EventEmitter<FileList>();
  @Output() pendingRemoved = new EventEmitter<number>();

  protected onFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.filesSelected.emit(input.files);
    }
    input.value = '';
  }

  protected removePending(index: number) {
    this.pendingRemoved.emit(index);
  }
}
