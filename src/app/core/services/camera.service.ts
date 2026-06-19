import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Camera, CameraConnectionStatus, CameraStatus } from '../models/camera.model';
import { MOCK_EVENTS } from '../../features/events/events.mock';

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

interface BackendConnectionResponse {
  input: { host: string; port: number };
  snapshot_url: string;
  stream_url: string;
  reachable: boolean;
  status_code: number | null;
  content_type: string | null;
  message: string;
}

interface BackendCameraConnectionDetail {
  camera_id: number;
  nombre_cam: string;
  direccion_ip: string;
  puerto: number;
  snapshot_url: string;
  stream_url: string;
  reachable: boolean;
  status_code: number | null;
  content_type: string | null;
  message: string;
}

const CONNECTION_FAIL: CameraConnectionStatus = {
  snapshotUrl: '',
  streamUrl: '',
  reachable: false,
  statusCode: null,
  contentType: null,
  message: 'Error al contactar el servidor',
};

function mapBackendCamera(b: BackendCamera, storeName = ''): Camera {
  return {
    id: String(b.id),
    name: b.nombre_cam,
    storeId: String(b.tienda_id),
    storeName,
    location: b.ubicacion_camara ?? '',
    ipUrl: b.direccion_ip,
    port: b.puerto,
    resolution: '1080p',
    status: b.estado ? 'online' : 'offline',
    capabilities: {
      facialRecognition: false,
      weaponDetection: false,
      recording: true,
    },
    createdAt: b.created_at.slice(0, 10),
  };
}

export interface CameraListResponse {
  items: Camera[];
  total: number;
  onlineCount: number;
  offlineCount: number;
  errorCount: number;
}

export interface CameraPayload {
  name: string;
  storeId: string;
  storeName: string;
  location: string;
  ipUrl: string;
  port?: number;
  status: CameraStatus;
}

@Injectable({ providedIn: 'root' })
export class CameraService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  list() {
    return this.http.get<BackendCamera[]>(`${this.base}/cameras`).pipe(
      map((arr) => {
        const items = arr.map((c) => mapBackendCamera(c));
        return {
          items,
          total: items.length,
          onlineCount: items.filter((c) => c.status === 'online').length,
          offlineCount: items.filter((c) => c.status === 'offline').length,
          errorCount: items.filter((c) => c.status === 'error' || c.status === 'maintenance').length,
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
      direccion_ip: payload.ipUrl,
      puerto: payload.port ?? 8080,
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
      direccion_ip: payload.ipUrl,
      puerto: payload.port ?? 8080,
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

  getRecentEvents(cameraId: string, limit = 5) {
    const items = MOCK_EVENTS
      .filter((e) => e.cameraId === cameraId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
    return of(items);
  }

  testIpWebcam(host: string, port: number) {
    const params = new HttpParams().set('host', host).set('port', String(port));
    return this.http
      .get<BackendConnectionResponse>(`${this.base}/cameras/test-ip-webcam`, { params })
      .pipe(
        map((b): CameraConnectionStatus => ({
          snapshotUrl: b.snapshot_url,
          streamUrl: b.stream_url,
          reachable: b.reachable,
          statusCode: b.status_code,
          contentType: b.content_type,
          message: b.message,
        })),
        catchError(() => of({ ...CONNECTION_FAIL })),
      );
  }

  getCameraConnection(cameraId: string) {
    return this.http
      .get<BackendCameraConnectionDetail>(`${this.base}/cameras/${cameraId}/connection`)
      .pipe(
        map((b): CameraConnectionStatus => ({
          cameraId: b.camera_id,
          snapshotUrl: b.snapshot_url,
          streamUrl: b.stream_url,
          reachable: b.reachable,
          statusCode: b.status_code,
          contentType: b.content_type,
          message: b.message,
        })),
        catchError((err) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status === 403) {
              return of({ ...CONNECTION_FAIL, message: 'No tienes permisos para probar esta cámara.' });
            }
            if (err.status === 0) {
              return of({ ...CONNECTION_FAIL, message: 'No se pudo conectar al servidor. Verifica que el backend esté activo.' });
            }
          }
          return of({ ...CONNECTION_FAIL, message: 'Sin acceso o cámara no encontrada.' });
        }),
      );
  }
}
