import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from './auth-store';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  return authStore.checkAuth().pipe(
    map(() => true),
    catchError(() =>
      authStore.refreshAndAuthenticate().pipe(
        map(() => true),
        catchError(() => of(router.createUrlTree(['/login'])))
      )
    )
  );
};
