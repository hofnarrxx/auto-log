import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { VehicleForm } from './features/vehicle/vehicle-form/vehicle-form';
import { Settings } from './features/settings/settings';
import { authGuard } from './core/auth/auth-guard';
import { AppLayout } from './core/layout/app-layout/app-layout';

export const routes: Routes = [
    {
        path: 'share/:token',
        loadComponent: () =>
            import('./features/share/shared-vehicle')
                .then(m => m.SharedVehicle)
    },

    {
        path: 'login',
        loadComponent: () =>
            import('./features/auth/login/login')
                .then(m => m.Login)
    },

    {
        path: 'register',
        loadComponent: () =>
            import('./features/auth/register/register')
                .then(m => m.Register)
    },
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },

            {
                path: 'dashboard',
                component: Dashboard
            },

            {
                path: 'settings',
                component: Settings
            },

            {
                path: 'add-vehicle',
                component: VehicleForm
            },

            {
                path: 'vehicles',
                canActivate: [authGuard],
                loadChildren: () =>
                    import('./features/vehicle/vehicle.routes')
                        .then(m => m.vehicleRoutes)
            }]
    }
];
