import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url.token';
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
}
