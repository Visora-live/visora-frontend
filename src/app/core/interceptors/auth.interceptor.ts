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
      // 401 → session invalid: log out and return to /login.
      // 403 is NOT redirected globally: route authorization is enforced by guards
      // (adminGuard → /unauthorized). A forbidden background API call (e.g. an
      // admin-only fetch made in the wrong role) must not hijack navigation; the
      // calling component handles it locally.
      const isAuthMe = req.url.endsWith('/auth/me');
      const shouldLogout =
        (!req.url.endsWith('/auth/login') && err.status === 401) ||
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
