# VISORA — Frontend

Panel de control para el sistema de monitoreo de seguridad VISORA. Permite gestionar cámaras, eventos y alertas en tiempo real con vistas diferenciadas por rol.

## Stack

- **Angular 17** con Signals y componentes standalone
- **Angular Material** (MDC) como sistema de diseño
- **RxJS** para flujo reactivo de datos
- **TypeScript** estricto

## Requisitos previos

- Node.js 22+
- Angular CLI (`npm install -g @angular/cli`)
- Backend VISORA corriendo en `http://localhost:8000`

## Instalación local

```bash
git clone https://github.com/Visora-live/visora-frontend.git
cd visora-frontend

npm install

ng serve -o
```

La app queda disponible en `http://localhost:4200`.

## Configuración de entorno

Edita `src/environments/environment.ts` para ajustar las URLs:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  mediamtxHlsBase: 'http://localhost:8888',
  mediamtxRtmpUrl: 'rtmp://localhost:1935',
};
```

## Estructura

```
src/app/
├── core/
│   ├── guards/        # authGuard, adminGuard, ownerGuard
│   ├── models/        # Tipos TypeScript (Camera, Event, Alert, Store, User)
│   └── services/      # HTTP services + StoreContextService
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
    └── components/    # StatusBadge, PageHeader, HlsPlayer, EmptyState...
```

## Roles y vistas

| Rol | Vista principal | Acceso |
|-----|----------------|--------|
| `admin` | `/stores` | Tiendas, usuarios, notificaciones |
| `propietario` | `/dashboard` | Sus cámaras en vivo, eventos y alertas de sus tiendas |

## Streaming de cámaras

Las cámaras transmiten vía **RTMP → MediaMTX → HLS**. El frontend consume el stream HLS mediante el componente `HlsPlayerComponent` (hls.js). Requiere MediaMTX corriendo en la red local.

## Build de producción

```bash
ng build
```

Los archivos generados quedan en `dist/` listos para servir con nginx u otro servidor estático.
