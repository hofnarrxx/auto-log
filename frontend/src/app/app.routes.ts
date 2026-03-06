import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { VehicleForm } from './features/vehicle/vehicle-form/vehicle-form';
import { authGuard } from './core/auth/auth-guard';
import { AppLayout } from './core/layout/app-layout/app-layout';

export const routes: Routes = [
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
                path: 'add-vehicle',
                component: VehicleForm
            },

            {
                path: 'vehicle',
                canActivate: [authGuard],
                loadChildren: () =>
                    import('./features/vehicle/vehicle.routes')
                        .then(m => m.vehicleRoutes)
            }]
    }
];
