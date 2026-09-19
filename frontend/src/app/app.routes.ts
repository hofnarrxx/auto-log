import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard';
import { demoGuard } from './core/auth/demo-guard';
import { AppLayout } from './core/layout/app-layout/app-layout';
import { authRoutes } from './features/auth/auth.routes';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/landing/landing').then((m) => m.Landing),
  },

  {
    path: 'share',
    loadChildren: () => import('./features/share/share.routes').then((m) => m.shareRoutes),
  },

  ...authRoutes,

  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'garage',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
      },

      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.routes').then((m) => m.settingsRoutes),
      },

      {
        path: 'add-vehicle',
        canActivate: [demoGuard],
        loadComponent: () =>
          import('./features/vehicle/vehicle-form/vehicle-form').then((m) => m.VehicleForm),
      },

      {
        path: 'vehicles',
        loadChildren: () =>
          import('./features/vehicle/vehicle.routes').then((m) => m.vehicleRoutes),
      },
    ],
  },

  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
