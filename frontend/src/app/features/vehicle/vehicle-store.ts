import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject, catchError, finalize, of, switchMap, tap } from 'rxjs';
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
  private readonly load$ = new Subject<void>();

  private readonly _vehicles = signal<Vehicle[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly vehicles = this._vehicles.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    this.load$
      .pipe(
        tap(() => {
          this._isLoading.set(true);
          this._error.set(null);
        }),
        switchMap(() =>
          this.vehicleApi.getAll().pipe(
            catchError(() => {
              this._error.set('dashboard.errors.loadFailed');
              return of<Vehicle[]>([]);
            }),
            finalize(() => this._isLoading.set(false))
          )
        )
      )
      .subscribe((data) => this._vehicles.set(data));
  }

  add(vehicle: CreateVehicleCommand): Observable<Vehicle> {
    return this.vehicleApi.create(vehicle).pipe(
      tap((newVehicle) => {
        this._vehicles.update((v) => [...v, newVehicle]);
      })
    );
  }

  update(vehicle: UpdateVehicleCommand): Observable<Vehicle> {
    return this.vehicleApi.update(vehicle).pipe(
      tap((updated) => {
        this._vehicles.update((list) => list.map((v) => (v.id === updated.id ? updated : v)));
      })
    );
  }

  remove(id: number): Observable<void> {
    return this.vehicleApi.remove(id).pipe(
      tap(() => {
        this._vehicles.update((v) => v.filter((vehicle) => vehicle.id !== id));
      })
    );
  }

  load(): void {
    this.load$.next();
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
