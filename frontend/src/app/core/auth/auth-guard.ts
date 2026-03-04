import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthApi } from './auth-api';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authApi = inject(AuthApi);
  const router = inject(Router);

  return authApi.checkAuth().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
