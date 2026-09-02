import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url.token';
import type { Page } from '../../shared/models';
import {
  buildFuelPageParams,
  buildMaintenancePageParams,
} from '../../shared/utils/http-params.utils';
import type {
  FuelQuery,
  FuelRecord,
  MaintenanceAttachmentDownloadUrlResponse,
  MaintenanceQuery,
  MaintenanceRecord,
} from '../vehicle/models';
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

  getFuelPage(token: string, query: FuelQuery): Observable<Page<FuelRecord>> {
    return this.http.get<Page<FuelRecord>>(`${this.shareApi}/${token}/fuel`, {
      params: buildFuelPageParams(query),
    });
  }

  getMaintenancePage(token: string, query: MaintenanceQuery): Observable<Page<MaintenanceRecord>> {
    return this.http.get<Page<MaintenanceRecord>>(`${this.shareApi}/${token}/maintenance`, {
      params: buildMaintenancePageParams(query),
    });
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
