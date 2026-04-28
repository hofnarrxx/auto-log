import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthApi } from './auth-api';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authApi = inject(AuthApi);

  const authReq = req.clone({
    withCredentials: true
  });

  const isShareRequest = req.url.includes('/share/');
  const isOnSharePage =
    router.url.startsWith('/share/') || window.location.pathname.startsWith('/share/');
  const isAuthRequest = req.url.includes('/api/auth/');
  const shouldTryRefresh =
    !isShareRequest &&
    !isOnSharePage &&
    !req.url.includes('/api/auth/login') &&
    !req.url.includes('/api/auth/register') &&
    !req.url.includes('/api/auth/logout') &&
    !req.url.includes('/api/auth/refresh');

  return next(authReq).pipe(
    catchError(err => {
      if (err.status === 401 && shouldTryRefresh) {
        return authApi.refreshSession().pipe(
          switchMap(() => next(authReq)),
          catchError(refreshErr => {

            authApi.isAuthenticated.set(false);
            return throwError(() => refreshErr);
          })
        );
      }

      if (err.status === 401 && !isShareRequest && !isOnSharePage && !isAuthRequest) {
    
        authApi.isAuthenticated.set(false);
      }
      return throwError(() => err);
    })
  );
};
