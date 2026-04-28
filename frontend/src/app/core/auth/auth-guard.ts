import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthApi } from './auth-api';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authApi = inject(AuthApi);
  const router = inject(Router);

  if (authApi.isAuthenticated()) {
    return true;
  }

  return authApi.checkAuth().pipe(
    map(() => {
      authApi.isAuthenticated.set(true);
      return true;
    }),
    catchError(() =>
      authApi.refreshSession().pipe(
        map(() => {
          authApi.isAuthenticated.set(true);
          return true;
        }),
        catchError(() => of(router.createUrlTree(['/login'])))
      )
    )
  );
};
