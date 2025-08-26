import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../../../../shared/src/lib/services/auth.service';
import { Router } from '@angular/router';

let isRefreshing = false;

export const AuthInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getAccessToken();
  if (token) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !request.url.includes('/auth/refresh')) {
        return handle401Error(request, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(
  request: any,
  next: any,
  authService: AuthService,
  router: Router
): Observable<any> {
  if (!isRefreshing) {
    isRefreshing = true;

    return authService.refreshToken().pipe(
      switchMap(() => {
        isRefreshing = false;
        const token = authService.getAccessToken();
        if (token) {
          request = request.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
        }
        return next(request);
      }),
      catchError((error) => {
        isRefreshing = false;
        authService.signOut();
        router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  return next(request);
}
