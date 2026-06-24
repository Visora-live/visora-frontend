import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Store, StoreStatus } from '../models/store.model';

interface BackendStore {
  id: number;
  nombre: string;
  direccion: string | null;
  ruc: string | null;
  estado_tienda: boolean;
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
    ruc: b.ruc ?? undefined,
    status: b.estado_tienda ? 'active' : 'inactive',
    cameraCount: 0,
    createdAt: b.created_at.slice(0, 10),
  };
}

export interface StoreListResponse {
  items: Store[];
  total: number;
}

export interface StorePayload {
  name: string;
  address: string;
  ruc?: string;
  status: StoreStatus;
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
      ruc: payload.ruc || null,
      estado_tienda: payload.status === 'active',
    };
    return this.http.post<BackendStore>(`${this.base}/stores`, body).pipe(
      map((b) => mapBackendStore(b)),
    );
  }

  update(id: string, payload: StorePayload) {
    const body = {
      nombre: payload.name,
      direccion: payload.address || null,
      ruc: payload.ruc || null,
      estado_tienda: payload.status === 'active',
    };
    return this.http.patch<BackendStore>(`${this.base}/stores/${id}`, body).pipe(
      map((b) => mapBackendStore(b)),
    );
  }

  delete(id: string) {
    return this.http.delete<BackendStore>(`${this.base}/stores/${id}`).pipe(
      map((b) => mapBackendStore(b)),
    );
  }
}
