# VISORA — Frontend

Panel de control del sistema de monitoreo de seguridad VISORA. Permite gestionar cámaras en vivo, eventos, alertas e identificaciones con vistas diferenciadas por rol.

## Stack

- **Angular 17** con Signals y componentes standalone
- **Angular Material** (MDC) como sistema de diseño
- **RxJS** para flujo reactivo de datos
- **HLS.js** para streaming de video en tiempo real
- **TypeScript** estricto

## Requisitos previos

- Node.js 22+
- Angular CLI (`npm install -g @angular/cli`)
- Backend VISORA corriendo en `http://localhost:8000`
- MediaMTX para streaming HLS

## Instalación local

```bash
git clone https://github.com/Visora-live/visora-frontend.git
cd visora-frontend

npm install

ng serve -o
```

La app queda disponible en `http://localhost:4200`.

## Configuración de entorno

Edita `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
  apiBaseUrl: 'http://localhost:8000/api',
  mediamtxRtmpUrl: 'rtmp://192.168.18.24:1935',
  mediamtxHlsBase: 'http://localhost:8888',
};
```

## Autenticación

El frontend **no almacena el JWT en localStorage**. El token vive en una cookie `httpOnly` gestionada por el backend. Solo se guarda un flag booleano `visora_logged_in` como indicador de sesión activa. Todas las peticiones HTTP incluyen `withCredentials: true` para que el navegador envíe la cookie automáticamente.

## Estructura

```
src/app/
├── core/
│   ├── guards/        # authGuard, adminGuard, ownerGuard
│   ├── interceptors/  # authInterceptor — withCredentials en todas las peticiones
│   ├── models/        # Tipos TypeScript (Camera, Event, Alert, Store, User)
│   └── services/      # HTTP services (auth, cameras, events, alerts, stores, users)
├── features/
│   ├── auth/          # Login, recuperación de contraseña
│   ├── cameras/       # Dashboard de cámaras, detalle, formularios
│   ├── events/        # Lista y detalle de eventos
│   ├── alerts/        # Lista y detalle de alertas
│   ├── stores/        # Lista, detalle y edición de tiendas
│   ├── users/         # Gestión de usuarios (admin)
│   ├── dashboard/     # Panel principal según rol
│   └── notifications/ # Solicitudes de recuperación (admin)
├── layout/
│   ├── app-shell/     # Layout principal con sidebar
│   └── sidebar/       # Navegación lateral + store switcher
└── shared/
    ├── components/    # StatusBadge, PageHeader, HlsPlayer, EmptyState
    └── pipes/         # AuthImagePipe — carga imágenes protegidas vía HttpClient
```

## Roles y vistas

| Rol | Vista principal | Acceso |
|-----|----------------|--------|
| `admin` | `/stores` | Tiendas, usuarios, notificaciones, reporte de algoritmo |
| `propietario` | `/dashboard` | Sus cámaras en vivo, eventos y alertas de sus tiendas |

## Streaming de cámaras

Las cámaras transmiten vía **RTMP → MediaMTX → HLS**. El componente `HlsPlayerComponent` consume el stream HLS con hls.js e IntersectionObserver (lazy load). Requiere MediaMTX corriendo en la red local.

## Imágenes protegidas

Los snapshots de detección están protegidos por autenticación. El pipe `AuthImagePipe` los carga via `HttpClient` (la cookie se envía automáticamente) y los convierte a `SafeUrl` mediante `FileReader`.

```html
@if (alert.snapshotUrl | authImage | async; as snap) {
  <img [src]="snap" />
}
```

## Build de producción

```bash
ng build
```

Los archivos generados quedan en `dist/` listos para servir con nginx u otro servidor estático.
