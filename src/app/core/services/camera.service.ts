import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Camera, CameraStatus } from '../models/camera.model';
import type { VisoraEvent, EventSeverity } from '../models/event.model';

interface BackendCamera {
  id: number;
  nombre_cam: string;
  direccion_ip: string;
  puerto: number;
  ubicacion_camara: string | null;
  estado: boolean;
  source_type: string;
  protocolo: string;
  tienda_id: number;
  created_at: string;
  updated_at: string;
}

interface BackendRecentEvent {
  id: number;
  tipo: string;
  severidad: string;
  estado: string;
  fecha_hora: string;
  comentario: string | null;
  camara_id: number;
}

function mapRecentEvent(b: BackendRecentEvent): VisoraEvent {
  const sev = b.severidad.toLowerCase();
  const severity: EventSeverity =
    sev === 'alta' || sev === 'critica' ? 'critical'
    : sev === 'baja' || sev === 'normal' ? 'normal'
    : 'suspicious';
  return {
    id: String(b.id),
    cameraId: String(b.camara_id),
    cameraName: '',
    storeId: '',
    storeName: '',
    location: '',
    severity,
    type: 'suspicious_activity',
    status: 'pending',
    description: b.comentario ?? b.tipo,
    timestamp: b.fecha_hora,
    evidence: [],
    recommendedActions: [],
    identifications: [],
  };
}

function mapBackendCamera(b: BackendCamera, storeName = ''): Camera {
  return {
    id: String(b.id),
    name: b.nombre_cam,
    storeId: String(b.tienda_id),
    storeName,
    location: b.ubicacion_camara ?? '',
    ipUrl: b.direccion_ip,
    port: b.puerto,
    status: b.estado ? 'online' : 'offline',
    createdAt: b.created_at.slice(0, 10),
  };
}

export interface CameraListResponse {
  items: Camera[];
  total: number;
  onlineCount: number;
  offlineCount: number;
}

export interface CameraPayload {
  name: string;
  storeId: string;
  storeName: string;
  location: string;
  ipUrl?: string;
  port?: number;
  status: CameraStatus;
}

// The stream is published by the phone via RTMP to the path cam<id>, so the
// camera's direccion_ip/puerto are no longer the transport — kept as harmless
// placeholders to satisfy the existing (non-null) backend columns.
const RTMP_PLACEHOLDER_HOST = 'rtmp';
const RTMP_PLACEHOLDER_PORT = 1935;

@Injectable({ providedIn: 'root' })
export class CameraService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  list(tiendaId?: string | null) {
    const url = tiendaId
      ? `${this.base}/cameras?tienda_id=${tiendaId}`
      : `${this.base}/cameras`;
    return this.http.get<BackendCamera[]>(url).pipe(
      map((arr) => {
        const items = arr.map((c) => mapBackendCamera(c));
        return {
          items,
          total: items.length,
          onlineCount: items.filter((c) => c.status === 'online').length,
          offlineCount: items.filter((c) => c.status === 'offline').length,
        };
      }),
    );
  }

  getById(id: string) {
    return this.http.get<BackendCamera>(`${this.base}/cameras/${id}`).pipe(
      switchMap((cam) =>
        this.http
          .get<{ id: number; nombre: string }>(`${this.base}/stores/${cam.tienda_id}`)
          .pipe(
            map((store) => mapBackendCamera(cam, store.nombre)),
            catchError(() => of(mapBackendCamera(cam, ''))),
          ),
      ),
      catchError(() => of(null)),
    );
  }

  create(payload: CameraPayload) {
    const body = {
      nombre_cam: payload.name,
      direccion_ip: payload.ipUrl || RTMP_PLACEHOLDER_HOST,
      puerto: payload.port ?? RTMP_PLACEHOLDER_PORT,
      tienda_id: Number(payload.storeId),
      ubicacion_camara: payload.location || null,
      estado: payload.status === 'online',
    };
    return this.http.post<BackendCamera>(`${this.base}/cameras`, body).pipe(
      map((b) => mapBackendCamera(b)),
    );
  }

  update(id: string, payload: CameraPayload) {
    const body = {
      nombre_cam: payload.name,
      direccion_ip: payload.ipUrl || RTMP_PLACEHOLDER_HOST,
      puerto: payload.port ?? RTMP_PLACEHOLDER_PORT,
      tienda_id: Number(payload.storeId),
      ubicacion_camara: payload.location || null,
      estado: payload.status === 'online',
    };
    return this.http.patch<BackendCamera>(`${this.base}/cameras/${id}`, body).pipe(
      map((b) => mapBackendCamera(b)),
    );
  }

  delete(id: string) {
    return this.http.delete<BackendCamera>(`${this.base}/cameras/${id}`).pipe(
      map((b) => mapBackendCamera(b)),
    );
  }

  getDetectionStatus(cameraId: string) {
    return this.http
      .get<{ camera_id: number; running: boolean }>(`${this.base}/cameras/${cameraId}/detect`)
      .pipe(catchError(() => of({ camera_id: Number(cameraId), running: false })));
  }

  startDetection(cameraId: string) {
    return this.http.post<{ camera_id: number; running: boolean }>(
      `${this.base}/cameras/${cameraId}/detect`,
      {},
    );
  }

  stopDetection(cameraId: string) {
    return this.http.delete<{ camera_id: number; running: boolean }>(
      `${this.base}/cameras/${cameraId}/detect`,
    );
  }

  detectionSnapshotUrl(cameraId: string, ts: number): string {
    return `${this.base}/cameras/${cameraId}/detect/snapshot?t=${ts}`;
  }

  getRecentEvents(cameraId: string, limit = 5) {
    const params = new HttpParams()
      .set('camara_id', cameraId)
      .set('limit', '50');
    return this.http
      .get<BackendRecentEvent[]>(`${this.base}/events`, { params })
      .pipe(
        map((events) =>
          events
            .filter((e) => e.estado !== 'descartado')
            .slice(0, limit)
            .map(mapRecentEvent),
        ),
        catchError(() => of([] as VisoraEvent[])),
      );
  }
}
