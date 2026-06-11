# VISORA — Contrato de API Frontend-Backend

> Versión: 1.0 | Fecha: 2026-06-11  
> Estado: Propuesta. No conectar backend hasta completar Fase 10B.

---

## Convenciones

- Base URL: `http://localhost:3000/api` (desarrollo) — definida en `environment.ts`
- Autenticación: `Authorization: Bearer <token>` en todos los endpoints protegidos
- Formato de fechas: ISO 8601 — `2026-06-11T14:32:07`
- IDs de tienda: formato `store-001`, `store-002`, etc.
- IDs de cámara: formato `cam-001`, `cam-002`, etc.
- Paginación: query params `page` (base 1) y `limit` (default 50)
- Errores de validación: `422 { errors: Record<string, string> }`
- No encontrado: `404 { message: string }`
- No autorizado: `401 { message: string }`

---

## Nota sobre modelo Evidence (inconsistencia actual)

`src/app/core/models/evidence.model.ts` define `{ id, eventId, type, url, capturedAt, metadata }`.  
`src/app/core/models/event.model.ts` define `Evidence` inline como `{ id, type, label, durationSeconds }`.

**Antes de integrar:** reconciliar ambas definiciones. El backend enviará `url` y `capturedAt`; el frontend necesita `label` y `durationSeconds` para display. El backend debe incluirlos o se derivan en el servicio.

---

## 1. Auth

### `POST /auth/login`

```
Body:
{
  "identifier": "string",   // username o email
  "password": "string"
}

Response 200:
{
  "token": "string",
  "user": {
    "id": "string",
    "fullName": "string",
    "email": "string",
    "role": "admin | operator | viewer",
    "storeId": "string?"
  }
}

Response 401:
{ "message": "string" }
```

- **Mock de referencia:** credenciales `admin` / `visora2026` en `login.ts:49`
- **Componente:** `LoginComponent`

---

### `POST /auth/forgot-password`

```
Body:
{ "email": "string" }

Response 200:
{ "message": "string" }

Response 404:
{ "message": "string" }
```

- **Componente:** `ForgotPasswordComponent`

---

### `GET /auth/me`

```
Headers: Authorization: Bearer <token>

Response 200:
{
  "id": "string",
  "fullName": "string",
  "email": "string",
  "role": "admin | operator | viewer",
  "storeId": "string?",
  "storeName": "string?"
}

Response 401:
{ "message": "string" }
```

- **Componente:** `TopbarComponent` (actualmente no muestra usuario autenticado — requiere integración)

---

## 2. Dashboard

### `GET /dashboard/metrics`

```
Response 200:
{
  "activeStores": number,
  "onlineCameras": number,
  "offlineCameras": number,
  "maintenanceCameras": number,
  "openAlerts": number,
  "criticalAlerts": number,
  "suspiciousEvents": number,
  "totalEvents": number
}
```

- **Mock de referencia:** `dashboard.ts` — stats derivadas de MOCK_STORES, MOCK_CAMERAS, MOCK_ALERTS, MOCK_EVENTS
- **Componente:** `DashboardComponent`

---

### `GET /dashboard/recent-alerts`

```
Query:  limit=5

Response 200:
Alert[]   // sorted desc por createdAt
```

- **Mock de referencia:** `dashboard.ts` — `MOCK_ALERTS.sort(...).slice(0, 5)`
- **Componente:** `DashboardComponent`

---

### `GET /dashboard/recent-events`

```
Query:  limit=5

Response 200:
VisoraEvent[]   // sorted desc por timestamp
```

- **Mock de referencia:** `dashboard.ts` — `MOCK_EVENTS.sort(...).slice(0, 5)`
- **Componente:** `DashboardComponent`

---

## 3. Stores

### `GET /stores`

```
Query:
  status=active|inactive
  search=string
  page=1
  limit=50

Response 200:
{
  "items": Store[],
  "total": number
}
```

- **Mock de referencia:** `MOCK_STORES` (8 items) — `store-list.ts` filtra en memoria
- **Componente:** `StoreListComponent`

---

### `GET /stores/:id`

```
Response 200:
Store & {
  "alertsOpen": number,
  "alertsResolved": number,
  "eventsTotal": number
}

Response 404:
{ "message": "string" }
```

- **Mock de referencia:** `MOCK_STORES.find(s => s.id)` + stats filtradas por `storeId` en `store-detail.ts:35-37`
- **Componente:** `StoreDetailComponent`

---

### `POST /stores`

```
Body:
{
  "name": "string",          // required
  "address": "string",       // required
  "city": "string",          // required
  "manager": "string",       // required
  "email": "string",         // required, formato email
  "phone": "string?",
  "status": "active | inactive",   // required
  "notes": "string?"         // max 500 caracteres
}

Response 201:
Store

Response 422:
{ "errors": { "field": "mensaje" } }
```

- **Mock de referencia:** `store-new.ts` form group (FormBuilder)
- **Componente:** `StoreNewComponent`

---

### `PUT /stores/:id`

```
Body:    (igual que POST /stores)

Response 200: Store
Response 404: { "message": "string" }
Response 422: { "errors": { "field": "mensaje" } }
```

- **Mock de referencia:** `store-edit.ts` — precarga `MOCK_STORES.find(s => s.id)`
- **Componente:** `StoreEditComponent`

---

## 4. Cameras

### `GET /cameras`

```
Query:
  storeId=string
  status=online|offline|error|maintenance
  search=string
  page=1
  limit=50

Response 200:
{
  "items": Camera[],
  "total": number,
  "onlineCount": number,
  "offlineCount": number,
  "errorCount": number
}
```

- **Mock de referencia:** `MOCK_CAMERAS` (12 items) — `camera-dashboard.ts` filtra en memoria
- **Componente:** `CameraDashboardComponent`

---

### `GET /cameras/:id`

```
Response 200: Camera
Response 404: { "message": "string" }
```

- **Mock de referencia:** `MOCK_CAMERAS.find(c => c.id)`
- **Componente:** `CameraDetailComponent`

---

### `POST /cameras`

```
Body:
{
  "name": "string",          // required
  "storeId": "string",       // required
  "location": "string",      // required
  "ipUrl": "string",         // required
  "resolution": "string",    // required
  "status": "online | offline | error | maintenance",  // required
  "capabilities": {
    "facialRecognition": boolean,
    "weaponDetection": boolean,
    "recording": boolean
  },
  "notes": "string?"
}

Response 201: Camera
Response 422: { "errors": { "field": "mensaje" } }
```

- **Mock de referencia:** `camera-new.ts` form group
- **Componente:** `CameraNewComponent`

---

### `PUT /cameras/:id`

```
Body:    (igual que POST /cameras)

Response 200: Camera
Response 404: { "message": "string" }
Response 422: { "errors": { "field": "mensaje" } }
```

- **Mock de referencia:** `camera-edit.ts` — precarga `MOCK_CAMERAS.find(c => c.id)`
- **Componente:** `CameraEditComponent`

---

### `GET /cameras/:id/events`

```
Query:  limit=5

Response 200:
VisoraEvent[]   // sorted desc por timestamp
```

- **Mock de referencia:** `camera-detail.ts:37` — `MOCK_EVENTS.filter(e => e.cameraId === cameraId).slice(0, 5)`
- **Componente:** `CameraDetailComponent`

---

## 5. Events

### `GET /events`

```
Query:
  storeId=string
  cameraId=string
  type=facial_recognition|weapon_detection|suspicious_activity|system
  severity=normal|suspicious|critical
  status=pending|reviewed|dismissed
  search=string
  page=1
  limit=50

Response 200:
{
  "items": VisoraEvent[],
  "total": number,
  "todayCount": number,
  "criticalCount": number,
  "suspiciousCount": number,
  "evidenceCount": number
}
```

- **Mock de referencia:** `MOCK_EVENTS` (12 items) — `event-list.ts` filtra en memoria
- **Componente:** `EventListComponent`
- **Nota:** `todayCount` actualmente calculado en frontend con fecha dinámica (`new Date().toISOString().slice(0, 10)`). Si el backend lo provee en el response, el frontend puede simplificarse.

---

### `GET /events/:id`

```
Response 200: VisoraEvent
Response 404: { "message": "string" }
```

- **Mock de referencia:** `MOCK_EVENTS.find(e => e.id)`
- **Componente:** `EventDetailComponent`

---

### `PATCH /events/:id/status`

```
Body:
{ "status": "reviewed | dismissed" }

Response 200: VisoraEvent
Response 404: { "message": "string" }
Response 409: { "message": "string" }   // si ya está en estado final
```

- **Mock de referencia:** `event-detail.ts` — `markReviewed()` / `dismissEvent()` con signals locales (sin persistencia)
- **Componente:** `EventDetailComponent`

---

## 6. Alerts

### `GET /alerts`

```
Query:
  storeId=string
  severity=normal|suspicious|critical
  status=open|acknowledged|resolved
  search=string
  page=1
  limit=50

Response 200:
{
  "items": Alert[],
  "total": number,
  "openCount": number,
  "criticalCount": number,
  "acknowledgedCount": number,
  "resolvedCount": number
}
```

- **Mock de referencia:** `MOCK_ALERTS` (12 items) — `alert-list.ts` filtra en memoria
- **Componente:** `AlertListComponent`

---

### `GET /alerts/:id`

```
Response 200: Alert
Response 404: { "message": "string" }
```

- **Mock de referencia:** `MOCK_ALERTS.find(a => a.id)`
- **Componente:** `AlertDetailComponent`

---

### `PATCH /alerts/:id/acknowledge`

```
Body:
{ "assignedTo": "string?" }

Response 200: Alert   // status = 'acknowledged', updatedAt seteado
Response 404: { "message": "string" }
Response 409: { "message": "string" }   // si ya está 'resolved'
```

- **Mock de referencia:** `alert-detail.ts` — `markAcknowledged()` con signal local
- **Componente:** `AlertDetailComponent`

---

### `PATCH /alerts/:id/resolve`

```
Body:
{ "notes": "string?" }

Response 200: Alert   // status = 'resolved', resolvedAt seteado
Response 404: { "message": "string" }
```

- **Mock de referencia:** `alert-detail.ts` — `resolveAlert()` con signal local
- **Componente:** `AlertDetailComponent`

---

## 7. Users

### `GET /users`

```
Query:
  role=admin|operator|viewer
  status=active|inactive
  search=string
  page=1
  limit=50

Response 200:
{
  "items": User[],
  "total": number,
  "activeCount": number,
  "adminCount": number,
  "operatorCount": number,
  "inactiveCount": number
}
```

- **Mock de referencia:** `MOCK_USERS` (8 items) — `user-list.ts` filtra en memoria
- **Componente:** `UserListComponent`

---

### `GET /users/:id`

```
Response 200:
User & {
  "recentActivity": UserActivity[]
}

Response 404: { "message": "string" }
```

- **Mock de referencia:** `MOCK_USERS.find(u => u.id)`
- **Componente:** `UserDetailComponent`

---

### `POST /users`

```
Body:
{
  "fullName": "string",      // required
  "email": "string",         // required, único
  "password": "string",      // required — campo pendiente de agregar al form user-new
  "role": "admin | operator | viewer",  // required
  "storeId": "string?",
  "phone": "string?",
  "status": "active | inactive",  // required
  "notes": "string?"         // max 500 caracteres
}

Response 201: User
Response 409: { "message": "string" }   // email duplicado
Response 422: { "errors": { "field": "mensaje" } }
```

- **Mock de referencia:** `user-new.ts` form group
- **Componente:** `UserNewComponent`
- **Pendiente:** agregar campo `password` al formulario antes de integrar

---

### `PUT /users/:id`

```
Body:
{
  "fullName": "string",      // required
  "email": "string",         // required
  "role": "admin | operator | viewer",  // required
  "storeId": "string?",
  "phone": "string?",
  "status": "active | inactive",  // required
  "notes": "string?"
  // password NO incluido — usar endpoint separado para cambio de clave
}

Response 200: User
Response 404: { "message": "string" }
Response 409: { "message": "string" }   // email duplicado
Response 422: { "errors": { "field": "mensaje" } }
```

- **Mock de referencia:** `user-edit.ts` — precarga `MOCK_USERS.find(u => u.id)`
- **Componente:** `UserEditComponent`

---

## Orden recomendado de integración

```
10B → 10C → 10D → 10E → 10F → 10G → 10H → 10I → 10J
infra  auth  dash  stores cams  evts  alrt  usrs  media
```

| Fase | Qué integrar | Por qué ese orden |
|------|-------------|-------------------|
| 10B | Infra HTTP (environment + interceptor) | Base que todo lo demás requiere |
| 10C | Auth real (login + guard) | Sin esto nada está protegido |
| 10D | Dashboard | Primera pantalla con datos reales — validación temprana del backend |
| 10E | Stores | Núcleo del sistema, bloquea cámaras (storeId) |
| 10F | Cameras | Depende de stores para storeId |
| 10G | Events | Depende de cameras para cameraId |
| 10H | Alerts | Depende de events para eventId |
| 10I | Users | Independiente; último porque requiere agregar campo password al form |
| 10J | Evidence / WebSocket | Requiere infraestructura de media del backend |

---

## Riesgos antes de conectar backend

1. **Sin guards ni interceptor** — cualquier URL es accesible sin token. Prioridad alta antes de cualquier deploy.

2. **Acciones sin persistencia** — `markReviewed`, `resolveAlert`, `dismissEvent` cambian un signal local; al recargar vuelven al estado original. El usuario puede confundirse en pruebas.

3. **Modelo `Evidence` duplicado** — `event.model.ts` y `evidence.model.ts` definen `Evidence` con campos distintos. Hay que unificar antes de mostrar evidencia real (imágenes, videos).

4. **Sin paginación** — todos los listados cargan todo en memoria y filtran en cliente. Con datos reales esto afecta rendimiento. Los componentes necesitan paginación antes de conectar a endpoints reales.

5. **Sin error states en páginas de detalle** — `store-detail`, `camera-detail`, `event-detail`, `alert-detail`, `user-detail` manejan `null` (not found) pero no el error de red. Con HTTP puede llegar un error 500 o timeout sin UI de error.

6. **`POST /users` sin campo `password`** — `user-new.ts` no incluye ese campo en el form. Hay que agregarlo antes de integrar ese endpoint.

7. **`ipUrl` de cámara expuesto directamente** — el form guarda la IP de la cámara tal cual. En producción el backend debe proxy los streams y nunca exponer IPs de cámaras al cliente.

8. **`setTimeout` simula latencia** — todos los forms usan `setTimeout(1200)`. Al conectar backend real, deben reemplazarse por subscriptions a observables con manejo de error (`catchError`, estado de error en signal).

---

## Servicios Angular a crear

```
src/app/core/
  services/
    auth.service.ts          // login, logout, me(), currentUser signal, isLoggedIn computed
    store.service.ts         // list, getById, create, update
    camera.service.ts        // list, getById, create, update, getRecentEvents
    event.service.ts         // list, getById, updateStatus
    alert.service.ts         // list, getById, acknowledge, resolve
    user.service.ts          // list, getById, create, update
    dashboard.service.ts     // getMetrics, getRecentAlerts, getRecentEvents

  interceptors/
    auth.interceptor.ts      // inyecta Bearer token en cada request; redirige a /login en 401

  guards/
    auth.guard.ts            // protege rutas del shell (canActivate)
```

Todos los servicios usarán `providedIn: 'root'` e `inject(HttpClient)`.

---

## Plan por fases para reemplazar mocks

### Fase 10B — Infraestructura HTTP

- Crear `src/environments/environment.ts` con `apiUrl: 'http://localhost:3000/api'`
- Crear `src/app/core/interceptors/auth.interceptor.ts`
  - Inyecta header `Authorization: Bearer <token>` en cada request
  - En respuesta 401, limpia token y navega a `/login`
- Registrar interceptor en `app.config.ts`
- Sin tocar ningún componente ni mock todavía

### Fase 10C — Auth real

- Crear `AuthService`: `login()`, `logout()`, `me()`, `currentUser` signal, `isLoggedIn` computed
- Crear `auth.guard.ts` — protege rutas del shell con `canActivate`
- `login.ts`: reemplazar `setTimeout` por `authService.login().subscribe()`
- `topbar.ts`: mostrar `authService.currentUser()?.fullName` en lugar de nada
- Los mocks de stores, cameras, events, etc. se mantienen intactos

### Fase 10D — Dashboard service

- Crear `DashboardService` con `getMetrics()`, `getRecentAlerts()`, `getRecentEvents()`
- `dashboard.ts`: reemplazar signals derivados de mocks por `toSignal(service.getMetrics())`
- Agregar loading state al dashboard (spinner mientras carga)
- Primera página con datos reales visible en la app

### Fase 10E — Stores service

- Crear `StoreService` con `list()`, `getById()`, `create()`, `update()`
- Reemplazar MOCK_STORES en `store-list`, `store-detail`, `store-new`, `store-edit`
- Agregar paginación básica en `store-list`
- Manejar error de red en `store-detail` (además del 404 ya manejado)

### Fase 10F — Cameras service

- Crear `CameraService` con `list()`, `getById()`, `create()`, `update()`, `getRecentEvents()`
- Reemplazar MOCK_CAMERAS en `camera-dashboard`, `camera-detail`, `camera-new`, `camera-edit`
- Agregar paginación en `camera-dashboard`

### Fase 10G — Events service

- Crear `EventService` con `list()`, `getById()`, `updateStatus()`
- Reemplazar MOCK_EVENTS en `event-list`, `event-detail`
- Conectar `markReviewed()` / `dismissEvent()` a `PATCH /events/:id/status`
- Manejar estado de error en `event-detail`

### Fase 10H — Alerts service

- Crear `AlertService` con `list()`, `getById()`, `acknowledge()`, `resolve()`
- Reemplazar MOCK_ALERTS en `alert-list`, `alert-detail`
- Conectar `markAcknowledged()` / `resolveAlert()` a endpoints reales

### Fase 10I — Users service

- Agregar campo `password` al form de `user-new.ts`
- Crear `UserService` con `list()`, `getById()`, `create()`, `update()`
- Reemplazar MOCK_USERS en `user-list`, `user-detail`, `user-new`, `user-edit`

### Fase 10J — Evidence y tiempo real

- Reconciliar modelo `Evidence` entre `event.model.ts` y `evidence.model.ts`
- Mostrar imágenes y videos reales desde URLs del backend (proxied, no IPs directas)
- WebSocket o Server-Sent Events para alertas en tiempo real en dashboard
- Actualización de estado de cámaras en tiempo real en `camera-dashboard`
