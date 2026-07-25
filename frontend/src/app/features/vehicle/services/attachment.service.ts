import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, concatMap, from, map, switchMap, toArray } from 'rxjs';
import { MaintenanceApiService } from './maintenance-api.service';

@Injectable({
  providedIn: 'root',
})
export class AttachmentService {
  readonly maxAttachmentBytes = 5 * 1024 * 1024;
  private static readonly MAX_IMAGE_DIMENSION = 1600;
  private static readonly IMAGE_QUALITY = 0.75;

  private readonly http = inject(HttpClient);
  private readonly maintenanceApiService = inject(MaintenanceApiService);

  isAllowedAttachment(file: File): boolean {
    return file.type === 'application/pdf' || file.type.startsWith('image/');
  }

  uploadAttachments(vehicleId: number, maintenanceId: number, files: File[]): Observable<void> {
    return from(files).pipe(
      concatMap((file) =>
        from(this.prepareAttachment(file)).pipe(
          switchMap((prepared) =>
            this.requestUploadUrl(vehicleId, maintenanceId, prepared).pipe(
              switchMap((response) =>
                this.uploadToR2(response.uploadUrl, prepared).pipe(
                  switchMap(() =>
                    this.saveAttachmentMetadata(
                      vehicleId,
                      maintenanceId,
                      prepared,
                      response.objectKey
                    )
                  )
                )
              )
            )
          )
        )
      ),
      toArray(),
      map(() => undefined)
    );
  }

  async prepareAttachment(file: File): Promise<File> {
    if (!file.type.startsWith('image/')) {
      return file;
    }

    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      AttachmentService.MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height)
    );
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
      canvas.toBlob(resolve, 'image/jpeg', AttachmentService.IMAGE_QUALITY)
    );

    if (!blob) {
      return file;
    }

    const name = file.name.replace(/\.[^.]+$/, '.jpg');
    const compressed = new File([blob], name, { type: 'image/jpeg' });

    if (compressed.size > this.maxAttachmentBytes) {
      throw new Error('Attachment too large');
    }

    return compressed;
  }

  private requestUploadUrl(vehicleId: number, maintenanceId: number, file: File) {
    return this.maintenanceApiService.getAttachmentUploadUrl(vehicleId, maintenanceId, file);
  }

  private uploadToR2(uploadUrl: string, file: File) {
    return this.http.put(uploadUrl, file, {
      headers: new HttpHeaders({ 'Content-Type': file.type }),
      responseType: 'text',
    });
  }

  private saveAttachmentMetadata(
    vehicleId: number,
    maintenanceId: number,
    file: File,
    objectKey: string
  ) {
    return this.maintenanceApiService.saveAttachmentMetadata(
      vehicleId,
      maintenanceId,
      file,
      objectKey
    );
  }
}
