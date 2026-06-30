import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Admin-only route. Propietario is redirected to /dashboard instead of /unauthorized. */
export const adminOnlyGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.getCurrentUser().pipe(
    map((user) =>
      auth.isAdminRole(user?.rol_tipo)
        ? true
        : router.createUrlTree(['/dashboard']),
    ),
  );
};
