import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'stores',
    pathMatch: 'full',
  },

  // Public routes — no shell
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

  // Main app routes — wrapped in shell layout
  {
    path: '',
    loadComponent: () =>
      import('./layout/app-shell/app-shell').then((m) => m.AppShellComponent),
    children: [
      {
        path: 'stores',
        loadComponent: () =>
          import('./features/stores/store-list/store-list').then(
            (m) => m.StoreListComponent,
          ),
      },
      {
        path: 'stores/new',
        loadComponent: () =>
          import('./features/stores/store-new/store-new').then(
            (m) => m.StoreNewComponent,
          ),
      },
      {
        path: 'stores/:id',
        loadComponent: () =>
          import('./features/stores/store-detail/store-detail').then(
            (m) => m.StoreDetailComponent,
          ),
      },
      {
        path: 'stores/:id/edit',
        loadComponent: () =>
          import('./features/stores/store-edit/store-edit').then(
            (m) => m.StoreEditComponent,
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
        path: 'cameras/new',
        loadComponent: () =>
          import('./features/cameras/camera-new/camera-new').then(
            (m) => m.CameraNewComponent,
          ),
      },
      {
        path: 'cameras/:id',
        loadComponent: () =>
          import('./features/cameras/camera-detail/camera-detail').then(
            (m) => m.CameraDetailComponent,
          ),
      },
      {
        path: 'cameras/:id/edit',
        loadComponent: () =>
          import('./features/cameras/camera-edit/camera-edit').then(
            (m) => m.CameraEditComponent,
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
    ],
  },

  // Error routes — no shell
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
