import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type {
  CreateVehicleCommand,
  UpdateVehicleCommand,
  Vehicle,
  VehicleImageUploadUrlResponse,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class VehicleApi {
  private readonly http = inject(HttpClient);
  private readonly vehicleApi = `${inject(API_BASE_URL)}/vehicles`;

  getAll(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(this.vehicleApi);
  }

  create(command: CreateVehicleCommand): Observable<Vehicle> {
    return this.http.post<Vehicle>(this.vehicleApi, command);
  }

  update(command: UpdateVehicleCommand): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.vehicleApi}/${command.id}`, command);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.vehicleApi}/${id}`);
  }

  requestImageUploadUrl(vehicleId: number, file: File): Observable<VehicleImageUploadUrlResponse> {
    return this.http.post<VehicleImageUploadUrlResponse>(
      `${this.vehicleApi}/${vehicleId}/image/upload-url`,
      {
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      }
    );
  }
}
