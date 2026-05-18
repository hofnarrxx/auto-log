import { Injectable, inject, signal } from '@angular/core';
import { Vehicle } from './vehicle-model';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface ShareLinkResponse {
  id: number;
  token: string;
  carId: number;
  createdBy: number;
  createdAt: string;
  expiresAt: string | null;
  revoked: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class VehicleStore {
  private http = inject(HttpClient);
  private api = 'http://localhost:8080/vehicles';
  private shareApi = 'http://localhost:8080/api/share-links';

  vehicles = signal<Vehicle[]>([]);

  add(vehicle: Vehicle) {
    this.http.post<Vehicle>(this.api, vehicle).subscribe(newVehicle => {
      this.vehicles.update(v => [...v, newVehicle]);
    });
  }

  update(vehicle: Vehicle) {
    this.http.put<Vehicle>(`${this.api}/${vehicle.id}`, vehicle).subscribe(updated => {
      this.vehicles.update(list =>
        list.map(v => (v.id === updated.id ? updated : v))
      );
    });
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.api}/${id}`).pipe(
      tap(() => {
        this.vehicles.update(v => v.filter(vehicle => vehicle.id !== id));
      })
    );
  }

  load() {
    this.http.get<Vehicle[]>(this.api).subscribe(data => {
      this.vehicles.set(data);
    });
  }

  createShareLink(carId: number): Observable<ShareLinkResponse> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    return this.http.post<ShareLinkResponse>(this.shareApi, {
      carId,
      expiresAt,
    });
  }

  listShareLinks(carId: number): Observable<ShareLinkResponse[]> {
    return this.http.get<ShareLinkResponse[]>(`${this.shareApi}?carId=${carId}`);
  }

  revokeShareLink(id: number): Observable<void> {
    return this.http.delete<void>(`${this.shareApi}/${id}`);
  }
}
