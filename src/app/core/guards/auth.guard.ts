import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.getToken()) return router.createUrlTree(['/login']);
  return auth.getCurrentUser().pipe(
    map((user) => (user !== null ? true : router.createUrlTree(['/login']))),
  );
};
