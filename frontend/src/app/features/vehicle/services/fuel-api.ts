import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { FuelRecord, FuelRecordPayload } from '../models';

@Injectable({
  providedIn: 'root',
})
export class FuelApi {
  private readonly http = inject(HttpClient);
  private readonly vehicleApi = `${inject(API_BASE_URL)}/vehicles`;

  getAll(vehicleId: number): Observable<FuelRecord[]> {
    return this.http.get<FuelRecord[]>(`${this.vehicleApi}/${vehicleId}/fuel`);
  }

  create(vehicleId: number, payload: FuelRecordPayload): Observable<FuelRecord> {
    return this.http.post<FuelRecord>(`${this.vehicleApi}/${vehicleId}/fuel`, payload);
  }

  update(vehicleId: number, recordId: number, payload: FuelRecordPayload): Observable<FuelRecord> {
    return this.http.put<FuelRecord>(`${this.vehicleApi}/${vehicleId}/fuel/${recordId}`, payload);
  }

  remove(vehicleId: number, recordId: number): Observable<void> {
    return this.http.delete<void>(`${this.vehicleApi}/${vehicleId}/fuel/${recordId}`);
  }
}
