import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Camera, CameraStatus } from '../models/camera.model';
import { MOCK_EVENTS } from '../../features/events/events.mock';

interface BackendCamera {
  id: number;
  nombre: string;
  host: string;
  puerto: number;
  ubicacion: string | null;
  estado: string;
  source_type: string;
  protocolo: string;
  tienda_id: number;
  created_at: string;
  updated_at: string;
}

function mapBackendCamera(b: BackendCamera, storeName = ''): Camera {
  return {
    id: String(b.id),
    name: b.nombre,
    storeId: String(b.tienda_id),
    storeName,
    location: b.ubicacion ?? '',
    ipUrl: b.host,
    resolution: '1080p', // backend has no resolution field; fixed default until backend adds it
    status: b.estado as CameraStatus,
    capabilities: {
      // backend has no capabilities fields; all default until backend adds them
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
  resolution: string;
  status: CameraStatus;
  capabilities: { facialRecognition: boolean; weaponDetection: boolean; recording: boolean };
  notes?: string;
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
      nombre: payload.name,
      host: payload.ipUrl,
      tienda_id: Number(payload.storeId),
      ubicacion: payload.location || null,
      estado: payload.status,
    };
    return this.http.post<BackendCamera>(`${this.base}/cameras`, body).pipe(
      map((b) => mapBackendCamera(b)),
    );
  }

  update(id: string, payload: CameraPayload) {
    const body = {
      nombre: payload.name,
      host: payload.ipUrl,
      tienda_id: Number(payload.storeId),
      ubicacion: payload.location || null,
      estado: payload.status,
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
}
