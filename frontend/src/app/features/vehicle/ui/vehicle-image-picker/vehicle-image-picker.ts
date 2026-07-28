import { Component, EventEmitter, Input, OnDestroy, Output, inject, signal } from '@angular/core';
import { VehicleImageService } from '../../services/vehicle-image.service';

/**
 * File input + preview for a vehicle photo. Delegates compression to `VehicleImageService` and
 * emits the prepared file once it is ready to upload; the parent decides when/how to upload it.
 */
@Component({
  selector: 'app-vehicle-image-picker',
  imports: [],
  templateUrl: './vehicle-image-picker.html',
  styleUrl: './vehicle-image-picker.css',
})
export class VehicleImagePicker implements OnDestroy {
  private readonly vehicleImageService = inject(VehicleImageService);
  private objectUrl: string | null = null;

  @Input()
  set currentImageUrl(value: string | null | undefined) {
    this.previewUrl.set(value ?? null);
  }

  @Output() imageSelected = new EventEmitter<File>();

  protected readonly previewUrl = signal<string | null>(null);

  ngOnDestroy() {
    this.revokeObjectUrl();
  }

  protected onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    this.vehicleImageService
      .prepareImage(file)
      .then((prepared) => {
        if (prepared.size > this.vehicleImageService.maxImageBytes) {
          return;
        }

        this.revokeObjectUrl();
        this.objectUrl = URL.createObjectURL(prepared);
        this.previewUrl.set(this.objectUrl);
        this.imageSelected.emit(prepared);
      })
      .catch(() => {
        // Skip preview if compression fails; selection remains unchanged.
      });
  }

  private revokeObjectUrl() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
