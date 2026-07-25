import { Routes } from '@angular/router';
import { VehicleDashboard } from './vehicle-dashboard/vehicle-dashboard';

export const vehicleRoutes: Routes = [{ path: ':id', component: VehicleDashboard }];
