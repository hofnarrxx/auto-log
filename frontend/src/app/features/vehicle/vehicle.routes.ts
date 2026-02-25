import { Routes } from '@angular/router';
import { VehicleDetails } from './vehicle-details/vehicle-details';

export const vehicleRoutes: Routes = [
  { path: ':id', component: VehicleDetails }
];