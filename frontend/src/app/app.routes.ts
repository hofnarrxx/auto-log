import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard';
import { demoGuard } from './core/auth/demo-guard';
import { AppLayout } from './core/layout/app-layout/app-layout';
import { RouteSeo } from './core/seo/route-seo.model';
import { authRoutes } from './features/auth/auth.routes';
import { legalRoutes } from './features/legal/legal.routes';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    data: { seo: { indexable: true, canonicalPath: '/' } satisfies RouteSeo },
    loadComponent: () => import('./features/landing/landing').then((m) => m.Landing),
  },

  {
    path: 'share',
    title: 'titles.share',
    // The URL contains a secret token: never index it and never leak it via Referer.
    data: { seo: { noReferrer: true } satisfies RouteSeo },
    loadChildren: () => import('./features/share/share.routes').then((m) => m.shareRoutes),
  },

  ...legalRoutes,

  ...authRoutes,

  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'garage',
        title: 'titles.garage',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
      },

      {
        path: 'settings',
        title: 'titles.settings',
        loadChildren: () =>
          import('./features/settings/settings.routes').then((m) => m.settingsRoutes),
      },

      {
        path: 'add-vehicle',
        title: 'titles.addVehicle',
        canActivate: [demoGuard],
        loadComponent: () =>
          import('./features/vehicle/vehicle-form/vehicle-form').then((m) => m.VehicleForm),
      },

      {
        path: 'vehicles',
        title: 'titles.vehicle',
        loadChildren: () =>
          import('./features/vehicle/vehicle.routes').then((m) => m.vehicleRoutes),
      },
    ],
  },

  {
    path: '**',
    title: 'titles.notFound',
    // No `seo` data: treated as noindex, so unknown URLs served with HTTP 200 are not indexed.
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
