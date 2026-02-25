import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { VehicleForm } from './features/vehicle/vehicle-form/vehicle-form';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: Dashboard },
    { path: 'add-vehicle', component: VehicleForm },
    {
        path: 'vehicle',
        loadChildren: () =>
            import('./features/vehicle/vehicle.routes')
                .then(m => m.vehicleRoutes)
    }
];
