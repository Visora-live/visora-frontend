import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Alert, AlertStatus } from '../models/alert.model';
import type { EventSeverity, EventType } from '../models/event.model';

interface BackendAlert {
  id: number;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  severidad: string;
  estado: string;
  evento_id: number | null;
  camara_id: number | null;
  tienda_id: number | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface BackendCameraMin {
  id: number;
  nombre: string;
  ubicacion: string | null;
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

function mapSeveridad(s: string): EventSeverity {
  const n = s.toLowerCase();
  if (n === 'normal' || n === 'baja') return 'normal';
  if (n === 'critical' || n === 'critica' || n === 'alta') return 'critical';
  return 'suspicious'; // 'media' → suspicious
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
): Alert {
  return {
    id: String(b.id),
    eventId: b.evento_id ? String(b.evento_id) : '',
    eventType: mapTipoToEventType(b.tipo),
    cameraId: b.camara_id ? String(b.camara_id) : '',
    cameraName,
    storeId: b.tienda_id ? String(b.tienda_id) : '',
    storeName,
    location,
    severity: mapSeveridad(b.severidad),
    status: mapEstadoAlerta(b.estado),
    title: b.titulo,
    description: b.descripcion ?? '',
    createdAt: b.created_at,
    updatedAt: b.updated_at || undefined,
    resolvedAt: b.resolved_at || undefined,
    evidence: [],          // not stored in backend alerts
    timeline: [],          // not stored in backend alerts
    recommendedActions: [], // not stored in backend alerts
  };
}

export interface AlertListResponse {
  items: Alert[];
  total: number;
  openCount: number;
  criticalCount: number;
  acknowledgedCount: number;
  resolvedCount: number;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  list() {
    return forkJoin([
      this.http.get<BackendAlert[]>(`${this.base}/alerts`),
      this.http.get<BackendCameraMin[]>(`${this.base}/cameras`).pipe(catchError(() => of([] as BackendCameraMin[]))),
      this.http.get<BackendStoreMin[]>(`${this.base}/stores`).pipe(catchError(() => of([] as BackendStoreMin[]))),
    ]).pipe(
      map(([alerts, cameras, stores]) => {
        const camMap = new Map(cameras.map((c) => [c.id, c]));
        const storeMap = new Map(stores.map((s) => [s.id, s.nombre]));
        const items = alerts.map((a) => {
          const cam = a.camara_id ? camMap.get(a.camara_id) : undefined;
          const storeId = a.tienda_id ?? cam?.tienda_id ?? null;
          return mapAlert(
            a,
            cam?.nombre ?? (a.camara_id ? `Cámara ${a.camara_id}` : ''),
            storeId ? (storeMap.get(storeId) ?? '') : '',
            cam?.ubicacion ?? '',
          );
        });
        return {
          items,
          total: items.length,
          openCount: items.filter((a) => a.status === 'open').length,
          criticalCount: items.filter((a) => a.severity === 'critical').length,
          acknowledgedCount: items.filter((a) => a.status === 'acknowledged').length,
          resolvedCount: items.filter((a) => a.status === 'resolved').length,
        };
      }),
    );
  }

  getById(id: string) {
    return this.http.get<BackendAlert>(`${this.base}/alerts/${id}`).pipe(
      switchMap((alert) => {
        const camId = alert.camara_id;
        if (!camId) return of(mapAlert(alert, '', '', ''));
        return this.http.get<BackendCameraMin>(`${this.base}/cameras/${camId}`).pipe(
          catchError(() => of(null as BackendCameraMin | null)),
          switchMap((cam) => {
            const storeId = alert.tienda_id ?? cam?.tienda_id ?? null;
            if (!storeId) return of(mapAlert(alert, cam?.nombre ?? '', '', cam?.ubicacion ?? ''));
            return this.http.get<BackendStoreMin>(`${this.base}/stores/${storeId}`).pipe(
              catchError(() => of(null as BackendStoreMin | null)),
              map((store) =>
                mapAlert(alert, cam?.nombre ?? '', store?.nombre ?? '', cam?.ubicacion ?? ''),
              ),
            );
          }),
        );
      }),
      catchError(() => of(null)),
    );
  }

  acknowledge(id: string, _assignedTo?: string) {
    // assignedTo not supported by backend — passed for API compatibility only
    return this.http
      .patch<BackendAlert>(`${this.base}/alerts/${id}`, { estado: 'reconocida' })
      .pipe(
        map((a) => mapAlert(a, '', '', '')),
        catchError(() => of(null)),
      );
  }

  resolve(id: string) {
    return this.http
      .patch<BackendAlert>(`${this.base}/alerts/${id}`, { estado: 'resuelta' })
      .pipe(
        map((a) => mapAlert(a, '', '', '')),
        catchError(() => of(null)),
      );
  }

  create(payload: {
    titulo: string;
    tipo?: string;
    severidad?: string;
    eventoId?: number;
    camaraId?: number;
    tiendaId?: number;
    descripcion?: string;
  }) {
    const body = {
      titulo: payload.titulo,
      tipo: payload.tipo ?? 'manual',
      severidad: payload.severidad ?? 'media',
      evento_id: payload.eventoId ?? null,
      camara_id: payload.camaraId ?? null,
      tienda_id: payload.tiendaId ?? null,
      descripcion: payload.descripcion ?? null,
    };
    return this.http.post<BackendAlert>(`${this.base}/alerts`, body).pipe(
      map((a) => mapAlert(a, '', '', '')),
    );
  }

  delete(id: string) {
    return this.http.delete<BackendAlert>(`${this.base}/alerts/${id}`).pipe(
      map((a) => mapAlert(a, '', '', '')),
      catchError(() => of(null)),
    );
  }
}
