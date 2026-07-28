import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { ObjectStorageApi } from '../../../shared/services/object-storage-api';
import { VehicleApi } from './vehicle-api';

/**
 * Encapsulates the canvas-based image compression and presigned-upload workflow used by the
 * vehicle form, keeping browser APIs (createImageBitmap, canvas) out of the component.
 */
@Injectable({
  providedIn: 'root',
})
export class VehicleImageService {
  private readonly vehicleApi = inject(VehicleApi);
  private readonly objectStorageApi = inject(ObjectStorageApi);

  private static readonly MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  private static readonly MAX_IMAGE_DIMENSION = 1600;
  private static readonly IMAGE_QUALITY = 0.75;

  readonly maxImageBytes = VehicleImageService.MAX_IMAGE_BYTES;

  /** Downscales/re-encodes an image so uploads stay under the size limit. Non-images pass through. */
  async prepareImage(file: File): Promise<File> {
    if (!file.type.startsWith('image/')) {
      return file;
    }

    const maxSize = VehicleImageService.MAX_IMAGE_DIMENSION;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', VehicleImageService.IMAGE_QUALITY)
    );

    if (!blob) {
      return file;
    }

    const name = file.name.replace(/\.[^.]+$/, '.jpg');
    return new File([blob], name, { type: 'image/jpeg' });
  }

  /** Requests a presigned URL for `vehicleId` and uploads `file` to it, returning the object key. */
  upload(vehicleId: number, file: File): Observable<string> {
    return this.vehicleApi
      .requestImageUploadUrl(vehicleId, file)
      .pipe(
        switchMap((response) =>
          this.objectStorageApi.upload(response.uploadUrl, file).pipe(map(() => response.objectKey))
        )
      );
  }
}
