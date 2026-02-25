import { Injectable, signal } from '@angular/core';
import { Vehicle } from './vehicle-model';

@Injectable({
  providedIn: 'root',
})
export class VehicleStore {
  private vehiclesSignal = signal<Vehicle[]>([]);
  private idCounter = 1;

  vehicles = this.vehiclesSignal.asReadonly();

  add(vehicle: Omit<Vehicle, 'id'>) {
    const newVehicle: Vehicle = {
      id: this.idCounter++,
      ...vehicle
    };
    this.vehiclesSignal.update(v => [...v, newVehicle]);
  }

  update(updatedVehicle: Vehicle) {
    this.vehiclesSignal.update(vehicles =>
      vehicles.map(v =>
        v.id === updatedVehicle.id ? updatedVehicle : v
      )
    );
  }

  remove(id: number) {
    this.vehiclesSignal.update(v => v.filter(vehicle => vehicle.id !== id));
  }
}
