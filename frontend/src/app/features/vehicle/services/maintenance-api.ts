import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { Page } from '../../../shared/models';
import { buildMaintenancePageParams } from '../../../shared/utils/http-params.utils';
import type {
  MaintenanceAttachment,
  MaintenanceAttachmentDownloadUrlResponse,
  MaintenanceAttachmentUploadUrlResponse,
  MaintenanceQuery,
  MaintenanceRecord,
  MaintenanceRecordPayload,
  MaintenanceSummary,
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
export class MaintenanceApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly vehicleApi = `${this.apiBaseUrl}/vehicles`;
  private readonly metadataApi = `${this.apiBaseUrl}/metadata/maintenance/categories`;

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(this.metadataApi);
  }

  getPage(vehicleId: string, query: MaintenanceQuery): Observable<Page<MaintenanceRecord>> {
    return this.http.get<Page<MaintenanceRecord>>(`${this.vehicleApi}/${vehicleId}/maintenance`, {
      params: buildMaintenancePageParams(query),
    });
  }

  getSummary(vehicleId: string): Observable<MaintenanceSummary> {
    return this.http.get<MaintenanceSummary>(`${this.vehicleApi}/${vehicleId}/maintenance/summary`);
  }

  getById(vehicleId: string, maintenanceId: string): Observable<MaintenanceRecord> {
    return this.http.get<MaintenanceRecord>(
      `${this.vehicleApi}/${vehicleId}/maintenance/${maintenanceId}`
    );
  }

  createMaintenance(
    vehicleId: string,
    payload: MaintenanceRecordPayload
  ): Observable<MaintenanceRecord> {
    return this.http.post<MaintenanceRecord>(
      `${this.vehicleApi}/${vehicleId}/maintenance`,
      payload
    );
  }

  updateMaintenance(
    vehicleId: string,
    maintenanceId: string,
    payload: MaintenanceRecordPayload
  ): Observable<MaintenanceRecord> {
    return this.http.put<MaintenanceRecord>(
      `${this.vehicleApi}/${vehicleId}/maintenance/${maintenanceId}`,
      payload
    );
  }

  deleteMaintenance(vehicleId: string, maintenanceId: string): Observable<void> {
    return this.http.delete<void>(`${this.vehicleApi}/${vehicleId}/maintenance/${maintenanceId}`);
  }

  getAttachmentUploadUrl(
    vehicleId: string,
    maintenanceId: string,
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
    vehicleId: string,
    maintenanceId: string,
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
    vehicleId: string,
    maintenanceId: string,
    attachmentId: string
  ): Observable<MaintenanceAttachmentDownloadUrlResponse> {
    return this.http.get<MaintenanceAttachmentDownloadUrlResponse>(
      `${this.vehicleApi}/${vehicleId}/maintenance/${maintenanceId}/attachments/${attachmentId}/download-url`
    );
  }
}
