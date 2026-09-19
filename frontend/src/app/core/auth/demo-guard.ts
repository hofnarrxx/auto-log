import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from './auth-store';

/**
 * Blocks navigation to routes that only make sense for a real, writable account (e.g. the
 * standalone add-vehicle page). The demo account has no nav link to these routes, but they are
 * still reachable by URL, so redirect back to the garage instead of rendering a form nobody can
 * submit.
 */
export const demoGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isDemo()) {
    return router.createUrlTree(['/garage']);
  }

  return true;
};
