import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Allows only propietario. Admin is redirected to /stores (their landing page). */
export const ownerGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.getCurrentUser().pipe(
    map((user) =>
      auth.isAdminRole(user?.rol_tipo)
        ? router.createUrlTree(['/stores'])
        : true,
    ),
  );
};
