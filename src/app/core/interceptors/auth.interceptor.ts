import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let redirectingToLogin = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  const outgoing = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(outgoing).pipe(
    catchError((err) => {
      // Skip global error handling for the login endpoint — LoginComponent handles its own errors.
      if (!req.url.endsWith('/auth/login')) {
        if (err.status === 401) {
          auth.logout();
          if (!redirectingToLogin) {
            redirectingToLogin = true;
            void router.navigate(['/login']).then(() => {
              redirectingToLogin = false;
            });
          }
        } else if (err.status === 403) {
          void router.navigate(['/unauthorized']);
        }
      }
      return throwError(() => err);
    }),
  );
};
