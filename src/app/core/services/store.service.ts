import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Store, StoreStatus } from '../models/store.model';
import { MOCK_ALERTS } from '../../features/alerts/alerts.mock';
import { MOCK_EVENTS } from '../../features/events/events.mock';

interface BackendStore {
  id: number;
  nombre: string;
  direccion: string | null;
  ruc: string | null;
  estado: string;
  licencia_inicio: string | null;
  licencia_fin: string | null;
  created_at: string;
  updated_at: string;
}

function mapBackendStore(b: BackendStore): Store {
  return {
    id: String(b.id),
    name: b.nombre,
    address: b.direccion ?? '',
    city: '',
    status: b.estado === 'activa' ? 'active' : 'inactive',
    cameraCount: 0,
    createdAt: b.created_at.slice(0, 10),
  };
}

export interface StoreListResponse {
  items: Store[];
  total: number;
}

export interface StoreMetrics {
  alertsOpen: number;
  alertsResolved: number;
  eventsTotal: number;
}

export interface StorePayload {
  name: string;
  address: string;
  city: string;
  status: StoreStatus;
  manager?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  list() {
    return this.http.get<BackendStore[]>(`${this.base}/stores`).pipe(
      map((arr) => ({ items: arr.map(mapBackendStore), total: arr.length })),
    );
  }

  getById(id: string) {
    return this.http.get<BackendStore>(`${this.base}/stores/${id}`).pipe(
      map((b) => mapBackendStore(b)),
      catchError(() => of(null)),
    );
  }

  create(payload: StorePayload) {
    const body = {
      nombre: payload.name,
      direccion: payload.address || null,
      estado: payload.status === 'active' ? 'activa' : 'inactiva',
    };
    return this.http.post<BackendStore>(`${this.base}/stores`, body).pipe(
      map((b) => mapBackendStore(b)),
    );
  }

  update(id: string, payload: StorePayload) {
    const body = {
      nombre: payload.name,
      direccion: payload.address || null,
      estado: payload.status === 'active' ? 'activa' : 'inactiva',
    };
    return this.http.patch<BackendStore>(`${this.base}/stores/${id}`, body).pipe(
      map((b) => mapBackendStore(b)),
    );
  }

  getMetricsByStore(id: string) {
    const metrics: StoreMetrics = {
      alertsOpen: MOCK_ALERTS.filter((a) => a.storeId === id && a.status === 'open').length,
      alertsResolved: MOCK_ALERTS.filter((a) => a.storeId === id && a.status === 'resolved').length,
      eventsTotal: MOCK_EVENTS.filter((e) => e.storeId === id).length,
    };
    return of(metrics);
  }
}
