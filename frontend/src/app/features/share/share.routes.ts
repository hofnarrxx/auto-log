import { Routes } from '@angular/router';

export const shareRoutes: Routes = [
  {
    path: ':token',
    loadComponent: () => import('./shared-vehicle').then((m) => m.SharedVehicle),
  },
];
