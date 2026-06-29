import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let redirectingToLogin = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // withCredentials ensures the httpOnly cookie is sent on every request
  const outgoing = req.clone({ withCredentials: true });

  return next(outgoing).pipe(
    catchError((err) => {
      const isAuthMe = req.url.endsWith('/auth/me');
      const shouldLogout =
        (!req.url.endsWith('/auth/login') &&
         !req.url.endsWith('/auth/logout') &&
         err.status === 401) ||
        (isAuthMe && err.status === 403);

      if (shouldLogout) {
        auth.logout();
        if (!redirectingToLogin) {
          redirectingToLogin = true;
          void router.navigate(['/login']).then(() => {
            redirectingToLogin = false;
          });
        }
      }
      return throwError(() => err);
    }),
  );
};
