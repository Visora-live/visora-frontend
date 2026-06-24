import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
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
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/app-shell/app-shell').then((m) => m.AppShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'stores',
        loadComponent: () =>
          import('./features/stores/store-list/store-list').then(
            (m) => m.StoreListComponent,
          ),
      },
      {
        path: 'stores/new',
        canActivate: [adminGuard],
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
        // Propietario may edit their own store; backend enforces ownership.
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
        // Propietario may add cameras to their own stores; backend enforces ownership.
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
        // Propietario may edit their own cameras; backend enforces ownership.
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
        path: 'events/:id',
        loadComponent: () =>
          import('./features/events/event-detail/event-detail').then(
            (m) => m.EventDetailComponent,
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
        path: 'alerts/:id',
        loadComponent: () =>
          import('./features/alerts/alert-detail/alert-detail').then(
            (m) => m.AlertDetailComponent,
          ),
      },
      {
        path: 'notifications',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/notifications/notification-list/notification-list').then(
            (m) => m.NotificationListComponent,
          ),
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/user-list/user-list').then((m) => m.UserListComponent),
      },
      {
        path: 'users/new',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/user-new/user-new').then((m) => m.UserNewComponent),
      },
      {
        path: 'users/:id',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/user-detail/user-detail').then((m) => m.UserDetailComponent),
      },
      {
        path: 'users/:id/edit',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/user-edit/user-edit').then((m) => m.UserEditComponent),
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
