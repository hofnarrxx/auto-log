import { Routes } from '@angular/router';
import { VehicleShell } from './vehicle-shell/vehicle-shell';
import { VehicleDashboard } from './vehicle-dashboard/vehicle-dashboard';

export const vehicleRoutes: Routes = [
  {
    path: ':id',
    component: VehicleShell,
    children: [{ path: '', component: VehicleDashboard }],
  },
];
