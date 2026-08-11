import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard';
import { AppLayout } from './core/layout/app-layout/app-layout';
import { authRoutes } from './features/auth/auth.routes';

// `authRoutes` is spread here rather than mounted via `loadChildren` under a `path: ''`
// parent: a second top-level `path: ''` route whose children (`login`/`register`) don't
// match the root URL leaves the router with nothing to activate instead of falling
// through to the next sibling route, so `/` never reaches the `AppLayout` redirect below.
export const routes: Routes = [
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
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      {
        path: 'dashboard',
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
