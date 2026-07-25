import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import type { ShareLinkResponse, Vehicle } from './models';

export type { ShareLinkResponse } from './models';

@Injectable({
  providedIn: 'root',
})
export class VehicleStore {
  private http = inject(HttpClient);
  private api = 'http://localhost:8080/vehicles';
  private shareApi = 'http://localhost:8080/api/share-links';

  vehicles = signal<Vehicle[]>([]);

  add(vehicle: Vehicle): Observable<Vehicle> {
    return this.http.post<Vehicle>(this.api, vehicle).pipe(
      tap(newVehicle => {
        this.vehicles.update(v => [...v, newVehicle]);
      })
    );
  }

  update(vehicle: Vehicle): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.api}/${vehicle.id}`, vehicle).pipe(
      tap(updated => {
        this.vehicles.update(list =>
          list.map(v => (v.id === updated.id ? updated : v))
        );
      })
    );
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

  createShareLink(carId: number, includeAttachments = true): Observable<ShareLinkResponse> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    return this.http.post<ShareLinkResponse>(this.shareApi, {
      carId,
      expiresAt,
      includeAttachments,
    });
  }

  listShareLinks(carId: number): Observable<ShareLinkResponse[]> {
    return this.http.get<ShareLinkResponse[]>(`${this.shareApi}?carId=${carId}`);
  }

  revokeShareLink(id: number): Observable<void> {
    return this.http.delete<void>(`${this.shareApi}/${id}`);
  }
}
