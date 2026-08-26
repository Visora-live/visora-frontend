# VISORA — Frontend

## Description

VISORA is a security monitoring system for retail stores ("bodegas"). It lets store owners and administrators watch live camera feeds, review detection events and alerts, and manage stores, cameras and users from a single dashboard.

This repository is the **frontend**: an Angular single-page application that renders role-specific dashboards (admin vs. store owner), plays live camera streams, and consumes the REST API exposed by the [VISORA backend](https://github.com/Visora-live/visora-backend). Detections shown here (weapon/facial-recognition events) are produced by the AI workers in [VISORA models](https://github.com/Visora-live/visora-models) and stored by the backend.

## Dataset Information

Not applicable. This repository contains application source code only. All data (stores, cameras, events, alerts, users) is fetched at runtime from the VISORA backend API; no dataset is bundled with this repository.

## Code Information

- **Framework:** Angular 22, standalone components, Signals for state.
- **UI:** Angular Material (MDC).
- **Data flow:** RxJS + HttpClient.
- **Video:** `hls.js` for live HLS playback.
- **Language:** TypeScript (strict mode).
- **Layout:**

  ```
  src/app/
  ├── core/
  │   ├── guards/        # authGuard, adminGuard, ownerGuard
  │   ├── interceptors/  # authInterceptor — withCredentials on every request
  │   ├── models/        # TypeScript types (Camera, Event, Alert, Store, User)
  │   └── services/      # HTTP services (auth, cameras, events, alerts, stores, users)
  ├── features/
  │   ├── auth/          # Login, password recovery
  │   ├── cameras/       # Camera dashboard, detail, forms
  │   ├── events/        # Event list and detail
  │   ├── alerts/        # Alert list and detail
  │   ├── stores/        # Store list, detail, edit
  │   ├── users/         # User management (admin)
  │   ├── dashboard/     # Role-specific main panel
  │   └── notifications/ # Password-recovery requests (admin)
  ├── layout/
  │   ├── app-shell/     # Main layout with sidebar
  │   └── sidebar/       # Side navigation + store switcher
  └── shared/
      ├── components/    # StatusBadge, PageHeader, HlsPlayer, EmptyState, ConfirmDialog
      └── pipes/         # AuthImagePipe — loads authenticated images via HttpClient
  ```

- **Roles and views:**

  | Role | Main view | Access |
  |------|-----------|--------|
  | `admin` | `/stores` | Stores, users, notifications, algorithm report |
  | `propietario` | `/dashboard` | Their own stores' live cameras, events and alerts |

## Usage Instructions

```bash
git clone https://github.com/Visora-live/visora-frontend.git
cd visora-frontend

npm install

ng serve -o
```

The app runs at `http://localhost:4200`.

Production build:

```bash
ng build
```

Output is written to `dist/`, ready to serve with nginx or any static file server (see `Dockerfile` / `nginx.conf`).

## Requirements

- Node.js 22+
- Angular CLI (`npm install -g @angular/cli`)
- VISORA backend running (default `http://localhost:8000`)
- MediaMTX running on the local network for HLS streaming
- Environment configuration in `src/environments/environment.ts`:

  ```typescript
  export const environment = {
    production: false,
    apiUrl: 'http://localhost:8000',
    apiBaseUrl: 'http://localhost:8000/api',
    mediamtxRtmpUrl: 'rtmp://192.168.18.24:1935',
    mediamtxHlsBase: 'http://localhost:8888',
  };
  ```

- Main npm dependencies: `@angular/*` (22.x), `@angular/material`, `hls.js`, `rxjs` — see `package.json`.

## Methodology

Architecture / data flow:

1. **Auth:** the JWT is never stored in `localStorage`. It lives in an httpOnly cookie set by the backend; the frontend only keeps a boolean `visora_logged_in` flag as a session indicator. Every HTTP request goes out with `withCredentials: true` so the browser attaches the cookie automatically.
2. **Access control:** `authGuard`, `adminGuard` and `ownerGuard` gate routes client-side; the backend re-checks role/ownership server-side on every request (the frontend guard is UX only, not the security boundary).
3. **Live video:** cameras stream RTMP → MediaMTX → HLS. `HlsPlayerComponent` consumes the HLS stream via `hls.js`, with `IntersectionObserver` used to lazy-load players only when visible.
4. **Protected images:** detection snapshots require authentication. `AuthImagePipe` fetches them through `HttpClient` (cookie sent automatically) and converts the response to a `SafeUrl` via `FileReader`:

   ```html
   @if (alert.snapshotUrl | authImage | async; as snap) {
     <img [src]="snap" />
   }
   ```

5. **Rendering data:** each `features/*` module owns its own service in `core/services`, calling the backend's REST endpoints and rendering role-scoped results (admin sees all stores; `propietario` sees only their own).

## Citations

Not applicable.

## License & Contribution Guidelines

Licensed under the [MIT License](./LICENSE).

This is an academic project (TP1). Contributions are currently managed directly by the project author; open an issue or pull request on GitHub if you'd like to propose a change.
