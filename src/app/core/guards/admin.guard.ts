import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.getCurrentUser().pipe(
    map((user) =>
      auth.isAdminRole(user?.rol_tipo)
        ? true
        : router.createUrlTree(['/unauthorized']),
    ),
  );
};
