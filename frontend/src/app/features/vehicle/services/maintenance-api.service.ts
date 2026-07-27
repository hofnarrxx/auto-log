import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type {
  MaintenanceAttachment,
  MaintenanceAttachmentDownloadUrlResponse,
  MaintenanceAttachmentUploadUrlResponse,
  MaintenanceRecord,
  MaintenanceRecordPayload,
} from '../models';

export type {
  MaintenanceAttachment,
  MaintenanceAttachmentDownloadUrlResponse,
  MaintenanceAttachmentUploadUrlResponse,
  MaintenanceRecord,
  MaintenanceRecordPayload,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly vehicleApi = `${this.apiBaseUrl}/vehicles`;
  private readonly metadataApi = `${this.apiBaseUrl}/metadata/maintenance/categories`;

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(this.metadataApi);
  }

  getMaintenance(vehicleId: number): Observable<MaintenanceRecord[]> {
    return this.http.get<MaintenanceRecord[]>(`${this.vehicleApi}/${vehicleId}/maintenance`);
  }

  createMaintenance(
    vehicleId: number,
    payload: MaintenanceRecordPayload
  ): Observable<MaintenanceRecord> {
    return this.http.post<MaintenanceRecord>(
      `${this.vehicleApi}/${vehicleId}/maintenance`,
      payload
    );
  }

  updateMaintenance(
    vehicleId: number,
    maintenanceId: number,
    payload: MaintenanceRecordPayload
  ): Observable<MaintenanceRecord> {
    return this.http.put<MaintenanceRecord>(
      `${this.vehicleApi}/${vehicleId}/maintenance/${maintenanceId}`,
      payload
    );
  }

  deleteMaintenance(vehicleId: number, maintenanceId: number): Observable<void> {
    return this.http.delete<void>(`${this.vehicleApi}/${vehicleId}/maintenance/${maintenanceId}`);
  }

  getAttachmentUploadUrl(
    vehicleId: number,
    maintenanceId: number,
    file: File
  ): Observable<MaintenanceAttachmentUploadUrlResponse> {
    return this.http.post<MaintenanceAttachmentUploadUrlResponse>(
      `${this.vehicleApi}/${vehicleId}/maintenance/${maintenanceId}/attachments/upload-url`,
      {
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      }
    );
  }

  saveAttachmentMetadata(
    vehicleId: number,
    maintenanceId: number,
    file: File,
    objectKey: string
  ): Observable<MaintenanceAttachment> {
    return this.http.post<MaintenanceAttachment>(
      `${this.vehicleApi}/${vehicleId}/maintenance/${maintenanceId}/attachments`,
      {
        objectKey,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      }
    );
  }

  getAttachmentDownloadUrl(
    vehicleId: number,
    maintenanceId: number,
    attachmentId: number
  ): Observable<MaintenanceAttachmentDownloadUrlResponse> {
    return this.http.get<MaintenanceAttachmentDownloadUrlResponse>(
      `${this.vehicleApi}/${vehicleId}/maintenance/${maintenanceId}/attachments/${attachmentId}/download-url`
    );
  }
}
