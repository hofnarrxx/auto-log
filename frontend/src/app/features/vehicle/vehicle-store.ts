import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ShareLinkApi } from './services/share-link-api';
import { VehicleApi } from './services/vehicle-api';
import type {
  CreateVehicleCommand,
  ShareLinkResponse,
  UpdateVehicleCommand,
  Vehicle,
} from './models';

export type { ShareLinkResponse } from './models';

@Injectable({
  providedIn: 'root',
})
export class VehicleStore {
  private readonly vehicleApi = inject(VehicleApi);
  private readonly shareLinkApi = inject(ShareLinkApi);

  vehicles = signal<Vehicle[]>([]);

  add(vehicle: CreateVehicleCommand): Observable<Vehicle> {
    return this.vehicleApi.create(vehicle).pipe(
      tap((newVehicle) => {
        this.vehicles.update((v) => [...v, newVehicle]);
      })
    );
  }

  update(vehicle: UpdateVehicleCommand): Observable<Vehicle> {
    return this.vehicleApi.update(vehicle).pipe(
      tap((updated) => {
        this.vehicles.update((list) => list.map((v) => (v.id === updated.id ? updated : v)));
      })
    );
  }

  remove(id: number): Observable<void> {
    return this.vehicleApi.remove(id).pipe(
      tap(() => {
        this.vehicles.update((v) => v.filter((vehicle) => vehicle.id !== id));
      })
    );
  }

  load(): void {
    this.vehicleApi.getAll().subscribe((data) => {
      this.vehicles.set(data);
    });
  }

  createShareLink(carId: number, includeAttachments = true): Observable<ShareLinkResponse> {
    return this.shareLinkApi.create(carId, includeAttachments);
  }

  listShareLinks(carId: number): Observable<ShareLinkResponse[]> {
    return this.shareLinkApi.list(carId);
  }

  revokeShareLink(id: number): Observable<void> {
    return this.shareLinkApi.revoke(id);
  }
}
