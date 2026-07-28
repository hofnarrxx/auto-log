import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url.token';
import type { MaintenanceAttachmentDownloadUrlResponse } from '../vehicle/models';
import type { SharedVehicleResponse } from './shared-vehicle-model';

@Injectable({
  providedIn: 'root',
})
export class PublicShareApi {
  private readonly http = inject(HttpClient);
  private readonly shareApi = `${inject(API_BASE_URL)}/share`;

  getSharedVehicle(token: string): Observable<SharedVehicleResponse> {
    return this.http.get<SharedVehicleResponse>(`${this.shareApi}/${token}`);
  }

  getMaintenanceAttachmentDownloadUrl(
    token: string,
    maintenanceId: number,
    attachmentId: number
  ): Observable<MaintenanceAttachmentDownloadUrlResponse> {
    return this.http.get<MaintenanceAttachmentDownloadUrlResponse>(
      `${this.shareApi}/${token}/maintenance/${maintenanceId}/attachments/${attachmentId}/download-url`
    );
  }
}
