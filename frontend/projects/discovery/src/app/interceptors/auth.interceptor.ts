import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { DiscoveryAuthService } from '../services/discovery-auth.service';
import { Router } from '@angular/router';

export const AuthInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(DiscoveryAuthService);
  const router = inject(Router);
  let isRefreshing = false;

  const token = authService.getAccessToken();
  if (token) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  const handle401Error = (req: HttpRequest<unknown>, handler: HttpHandlerFn) => {
    if (!isRefreshing) {
      isRefreshing = true;

      return authService.refreshToken().pipe(
        switchMap(() => {
          isRefreshing = false;
          const newToken = authService.getAccessToken();
          if (newToken) {
            req = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
          }
          return handler(req);
        }),
        catchError((error) => {
          isRefreshing = false;
          authService.signOut();
          router.navigate(['/login']);
          return throwError(() => error);
        })
      );
    }

    return handler(req);
  };

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !request.url.includes('/auth/refresh')) {
        return handle401Error(request, next);
      }
      return throwError(() => error);
    })
  );
};
