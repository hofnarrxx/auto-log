import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  const authReq = req.clone({
    withCredentials: true
  });

  return next(authReq).pipe(
    catchError(err => {
      const isShareRequest = req.url.includes('/share/');
      const isOnSharePage =
        router.url.startsWith('/share/') || window.location.pathname.startsWith('/share/');

      if (err.status === 401 && !isShareRequest && !isOnSharePage) {
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
