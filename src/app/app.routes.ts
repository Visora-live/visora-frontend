import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'stores',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'stores',
    loadComponent: () =>
      import('./features/stores/store-list/store-list').then(
        (m) => m.StoreListComponent,
      ),
  },
  {
    path: 'cameras',
    loadComponent: () =>
      import('./features/cameras/camera-dashboard/camera-dashboard').then(
        (m) => m.CameraDashboardComponent,
      ),
  },
  {
    path: 'events',
    loadComponent: () =>
      import('./features/events/event-list/event-list').then(
        (m) => m.EventListComponent,
      ),
  },
  {
    path: 'alerts',
    loadComponent: () =>
      import('./features/alerts/alert-list/alert-list').then(
        (m) => m.AlertListComponent,
      ),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/errors/unauthorized/unauthorized').then(
        (m) => m.UnauthorizedComponent,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/errors/not-found/not-found').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
