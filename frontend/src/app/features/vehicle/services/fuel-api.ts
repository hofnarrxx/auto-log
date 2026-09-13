import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { Page } from '../../../shared/models';
import { buildFuelPageParams } from '../../../shared/utils/http-params.utils';
import type { FuelQuery, FuelRecord, FuelRecordPayload, FuelSummary } from '../models';

@Injectable({
  providedIn: 'root',
})
export class FuelApi {
  private readonly http = inject(HttpClient);
  private readonly vehicleApi = `${inject(API_BASE_URL)}/vehicles`;

  getPage(vehicleId: string, query: FuelQuery): Observable<Page<FuelRecord>> {
    return this.http.get<Page<FuelRecord>>(`${this.vehicleApi}/${vehicleId}/fuel`, {
      params: buildFuelPageParams(query),
    });
  }

  getSummary(vehicleId: string): Observable<FuelSummary> {
    return this.http.get<FuelSummary>(`${this.vehicleApi}/${vehicleId}/fuel/summary`);
  }

  create(vehicleId: string, payload: FuelRecordPayload): Observable<FuelRecord> {
    return this.http.post<FuelRecord>(`${this.vehicleApi}/${vehicleId}/fuel`, payload);
  }

  update(vehicleId: string, recordId: string, payload: FuelRecordPayload): Observable<FuelRecord> {
    return this.http.put<FuelRecord>(`${this.vehicleApi}/${vehicleId}/fuel/${recordId}`, payload);
  }

  remove(vehicleId: string, recordId: string): Observable<void> {
    return this.http.delete<void>(`${this.vehicleApi}/${vehicleId}/fuel/${recordId}`);
  }
}
