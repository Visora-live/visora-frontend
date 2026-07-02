import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Alert, AlertStatus } from '../models/alert.model';
import type { EventType } from '../models/event.model';

interface BackendAlert {
  id: number;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  estado: string;
  evento_id: number | null;
  camara_id: number | null;
  tienda_id: number | null;
  leida: boolean;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface BackendCameraMin {
  id: number;
  nombre_cam: string;
  ubicacion_camara: string | null;
  tienda_id: number;
}

interface BackendStoreMin {
  id: number;
  nombre: string;
}

function mapTipoToEventType(t: string): EventType {
  const n = t.toLowerCase();
  if (n === 'facial_recognition' || n.includes('facial') || n.includes('reconocimiento')) return 'facial_recognition';
  if (n === 'weapon_detection' || n.includes('arma') || n.includes('weapon')) return 'weapon_detection';
  if (n === 'system' || n === 'sistema') return 'system';
  return 'suspicious_activity';
}

function mapEstadoAlerta(s: string): AlertStatus {
  if (s === 'reconocida' || s === 'acknowledged') return 'acknowledged';
  if (s === 'resuelta' || s === 'resolved' || s === 'descartada') return 'resolved';
  return 'open'; // 'abierta' → open
}

function mapAlert(
  b: BackendAlert,
  cameraName: string,
  storeName: string,
  location: string,
  apiBase: string,
): Alert {
  const tipo = b.tipo?.toLowerCase() ?? '';
  const isWeapon = tipo === 'weapon_detection' || tipo.includes('weapon') || tipo.includes('arma');
  return {
    id: String(b.id),
    eventId: b.evento_id ? String(b.evento_id) : '',
    eventType: mapTipoToEventType(b.tipo),
    cameraId: b.camara_id ? String(b.camara_id) : '',
    cameraName,
    storeId: b.tienda_id ? String(b.tienda_id) : '',
    storeName,
    location,
    status: mapEstadoAlerta(b.estado),
    title: b.titulo,
    description: b.descripcion ?? '',
    leida: b.leida ?? false,
    createdAt: b.created_at,
    updatedAt: b.updated_at || undefined,
    resolvedAt: b.resolved_at || undefined,
    evidence: [],
    timeline: [],
    recommendedActions: [],
    snapshotUrl: b.evento_id
      ? `${apiBase}/event-images/by-event/${b.evento_id}/file`
      : (isWeapon && b.camara_id ? `${apiBase}/cameras/${b.camara_id}/detect/snapshot` : undefined),
  };
}

export interface AlertListResponse {
  items: Alert[];
  total: number;
  openCount: number;
  acknowledgedCount: number;
  resolvedCount: number;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /** Emits when an alert is marked read — lets sidebar refresh badge immediately. */
  readonly refresh$ = new Subject<void>();

  list(tiendaId?: string | null) {
    const alertUrl = tiendaId ? `${this.base}/alerts?tienda_id=${tiendaId}` : `${this.base}/alerts`;
    const camUrl = tiendaId ? `${this.base}/cameras?tienda_id=${tiendaId}` : `${this.base}/cameras`;
    return forkJoin([
      // A transient failure here (401 blip, network hiccup) must not kill the
      // whole observable — callers that poll on an interval (alert-list,
      // dashboard) would otherwise have their polling loop die permanently
      // on the very first error and never recover without a page reload.
      this.http.get<BackendAlert[]>(alertUrl).pipe(catchError(() => of([] as BackendAlert[]))),
      this.http.get<BackendCameraMin[]>(camUrl).pipe(catchError(() => of([] as BackendCameraMin[]))),
      this.http.get<BackendStoreMin[]>(`${this.base}/stores`).pipe(catchError(() => of([] as BackendStoreMin[]))),
    ]).pipe(
      map(([alerts, cameras, stores]) => {
        const camMap = new Map(cameras.map((c) => [c.id, c]));
        const storeMap = new Map(stores.map((s) => [s.id, s.nombre]));
        const items = alerts
          .map((a) => {
            const cam = a.camara_id ? camMap.get(a.camara_id) : undefined;
            const storeId = a.tienda_id ?? cam?.tienda_id ?? null;
            return mapAlert(
              a,
              cam?.nombre_cam ?? (a.camara_id ? `Cámara ${a.camara_id}` : ''),
              storeId ? (storeMap.get(storeId) ?? '') : '',
              cam?.ubicacion_camara ?? '',
              this.base,
            );
          })
          .filter((a) => a.status !== 'resolved');
        return {
          items,
          total: items.length,
          openCount: items.filter((a) => a.status === 'open').length,
          acknowledgedCount: items.filter((a) => a.status === 'acknowledged').length,
          resolvedCount: items.filter((a) => a.status === 'resolved').length,
        };
      }),
    );
  }

  /** Lightweight — no camera/store name join, used for polling a single camera's alerts. */
  listByCamera(cameraId: string) {
    return this.http.get<BackendAlert[]>(`${this.base}/alerts?camara_id=${cameraId}`).pipe(
      map((alerts) => alerts.map((a) => mapAlert(a, '', '', '', this.base))),
      catchError(() => of([] as Alert[])),
    );
  }

  getById(id: string) {
    return this.http.get<BackendAlert>(`${this.base}/alerts/${id}`).pipe(
      switchMap((alert) => {
        const camId   = alert.camara_id;
        const storeId = alert.tienda_id;
        if (!camId && !storeId) return of(mapAlert(alert, '', '', '', this.base));
        return forkJoin({
          cam:   camId   ? this.http.get<BackendCameraMin>(`${this.base}/cameras/${camId}`).pipe(catchError(() => of(null as BackendCameraMin | null)))   : of(null as BackendCameraMin | null),
          store: storeId ? this.http.get<BackendStoreMin>(`${this.base}/stores/${storeId}`).pipe(catchError(() => of(null as BackendStoreMin | null))) : of(null as BackendStoreMin | null),
        }).pipe(
          map(({ cam, store }) =>
            mapAlert(alert, cam?.nombre_cam ?? '', store?.nombre ?? '', cam?.ubicacion_camara ?? '', this.base),
          ),
        );
      }),
      catchError(() => of(null)),
    );
  }

  unreadCount(tiendaId?: string | null) {
    const url = tiendaId
      ? `${this.base}/alerts/unread-count?tienda_id=${tiendaId}`
      : `${this.base}/alerts/unread-count`;
    return this.http
      .get<{ count: number }>(url)
      .pipe(
        map((r) => r.count),
        catchError(() => of(0)),
      );
  }

  markRead(id: string) {
    return this.http
      .patch<BackendAlert>(`${this.base}/alerts/${id}`, { leida: true })
      .pipe(
        tap(() => this.refresh$.next()),
        catchError(() => of(null)),
      );
  }

  acknowledge(id: string, _assignedTo?: string) {
    // assignedTo not supported by backend — passed for API compatibility only
    return this.http
      .patch<BackendAlert>(`${this.base}/alerts/${id}`, { estado: 'reconocida' })
      .pipe(
        map((a) => mapAlert(a, '', '', '', this.base)),
        catchError(() => of(null)),
      );
  }

  resolve(id: string) {
    return this.http
      .patch<BackendAlert>(`${this.base}/alerts/${id}`, { estado: 'resuelta' })
      .pipe(
        map((a) => mapAlert(a, '', '', '', this.base)),
        catchError(() => of(null)),
      );
  }

  create(payload: {
    titulo: string;
    tipo?: string;
    eventoId?: number;
    camaraId?: number;
    tiendaId?: number;
    descripcion?: string;
  }) {
    const body = {
      titulo: payload.titulo,
      tipo: payload.tipo ?? 'manual',
      evento_id: payload.eventoId ?? null,
      camara_id: payload.camaraId ?? null,
      tienda_id: payload.tiendaId ?? null,
      descripcion: payload.descripcion ?? null,
    };
    return this.http.post<BackendAlert>(`${this.base}/alerts`, body).pipe(
      map((a) => mapAlert(a, '', '', '', this.base)),
    );
  }

  delete(id: string) {
    return this.http.delete<BackendAlert>(`${this.base}/alerts/${id}`).pipe(
      map((a) => mapAlert(a, '', '', '', this.base)),
      catchError(() => of(null)),
    );
  }
}
