import { Injectable, inject, signal } from '@angular/core';
import { Vehicle } from './vehicle-model';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VehicleStore {
  private http = inject(HttpClient);
  private api = 'http://localhost:8080/vehicles';

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
}
